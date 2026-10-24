import * as THREE from "three";

// Lo que comparten todas las escenas: tamaño que sigue al contenedor, densidad de píxeles
// limitada, pausa cuando la escena sale de pantalla o la pestaña se oculta, y limpieza al salir.
export interface Escena {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  chico: boolean;
  quieto: boolean;
  size: () => { w: number; h: number };
  onResize: (fn: (w: number, h: number) => void) => void;
  loop: (fn: (dt: number, t: number) => void) => void;
  track: <T extends { dispose: () => void }>(x: T) => T;
  dispose: () => void;
}

export function montar(mount: HTMLElement, opts: { dpr?: number; suave?: boolean } = {}): Escena | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: opts.suave ?? true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const chico = window.innerWidth < 768;
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, chico ? 1.5 : (opts.dpr ?? 2)));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const extras: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(x: T) => {
    extras.push(x);
    return x;
  };

  let w = Math.max(1, mount.clientWidth);
  let h = Math.max(1, mount.clientHeight);
  renderer.setSize(w, h, false);
  const resizers: ((w: number, h: number) => void)[] = [];
  const ro = new ResizeObserver(() => {
    const nw = Math.max(1, mount.clientWidth);
    const nh = Math.max(1, mount.clientHeight);
    if (nw === w && nh === h) return;
    w = nw;
    h = nh;
    renderer.setSize(w, h, false);
    resizers.forEach((f) => f(w, h));
  });
  ro.observe(mount);

  let visible = true;
  const io = new IntersectionObserver((e) => (visible = e[0]?.isIntersecting ?? true), { rootMargin: "120px" });
  io.observe(mount);

  let raf = 0;
  let antes = performance.now();
  const inicio = antes;
  let fn: ((dt: number, t: number) => void) | null = null;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    const ahora = performance.now();
    const dt = Math.min((ahora - antes) / 1000, 0.25);
    antes = ahora;
    if (!visible || document.visibilityState === "hidden") return;
    fn?.(dt, (ahora - inicio) / 1000);
  };
  raf = requestAnimationFrame(tick);

  return {
    renderer,
    scene,
    chico,
    quieto,
    size: () => ({ w, h }),
    onResize: (f) => resizers.push(f),
    loop: (f) => (fn = f),
    track,
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      extras.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    },
  };
}

/** color de una variable CSS de la paleta, para que la escena use los mismos tonos que la página */
export const cssColor = (name: string, fallback: string) => {
  if (typeof window === "undefined") return new THREE.Color(fallback);
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || fallback);
};

export const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));

let texSombra: THREE.CanvasTexture | null = null;
/** sombra de contacto: un plano con degradé radial, mucho más liviano que un mapa de sombras */
export function sombra(w: number, d: number, opacidad = 0.28) {
  if (!texSombra) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const r = g.createRadialGradient(64, 64, 6, 64, 64, 64);
    r.addColorStop(0, "rgba(40,30,20,1)");
    r.addColorStop(0.55, "rgba(40,30,20,0.45)");
    r.addColorStop(1, "rgba(40,30,20,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    texSombra = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: texSombra, transparent: true, opacity: opacidad, depthWrite: false }));
  m.renderOrder = 1;
  return m;
}

/** texto plano en un sprite, para rótulos dentro de la escena */
export function rotulo(texto: string, opts: { color?: string; fondo?: string; px?: number; peso?: number } = {}) {
  const px = opts.px ?? 44;
  const c = document.createElement("canvas");
  const g = c.getContext("2d")!;
  const fuente = `${opts.peso ?? 700} ${px}px Nunito, system-ui, sans-serif`;
  g.font = fuente;
  const ancho = Math.ceil(g.measureText(texto).width) + px;
  c.width = ancho;
  c.height = Math.ceil(px * 1.7);
  g.font = fuente;
  if (opts.fondo) {
    g.fillStyle = opts.fondo;
    const r = c.height / 2;
    g.beginPath();
    g.roundRect(0, 0, c.width, c.height, r);
    g.fill();
  }
  g.fillStyle = opts.color ?? "#1c2630";
  g.textBaseline = "middle";
  g.fillText(texto, px / 2, c.height / 2 + 1);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  const alto = 0.34;
  sp.scale.set((alto * c.width) / c.height, alto, 1);
  return { sprite: sp, tex };
}

/** techo a dos aguas: un prisma triangular apoyado sobre el cuerpo */
export function techo(ancho: number, alto: number, largo: number) {
  const g = new THREE.CylinderGeometry(1, 1, largo, 3, 1);
  g.rotateZ(Math.PI / 2);
  g.rotateX(-Math.PI / 2);
  g.scale(1, alto / 1.5, ancho / 1.732);
  // el prisma queda con la base plana hacia abajo
  g.computeBoundingBox();
  const bb = g.boundingBox!;
  g.translate(0, -bb.min.y, 0);
  return g;
}
