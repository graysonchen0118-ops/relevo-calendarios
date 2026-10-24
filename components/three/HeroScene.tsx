"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { cssColor, damp, montar, sombra, techo } from "./kit";
import { foto } from "@/lib/photos";

// La cartera en miniatura: cabañas entre pinos, el edificio frente al mar con el 2A y el 2B,
// las dos casas gemelas, y delante el calendario como un tablero de fichas. Las fichas ámbar
// son noches bloqueadas a mano que todavía no están en Smoobu; al cargarlas se dan vuelta en verde.
export default function HeroScene({ pendientes, total }: { pendientes: number; total: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const datos = useRef({ pendientes, total });
  datos.current = { pendientes, total };

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const k = montar(mount, { dpr: 1.25 });
    if (!k) return;
    const { scene, renderer, track, chico, quieto } = k;
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
    const encuadre = (w: number, h: number) => {
      camera.aspect = w / h;
      const ancho = w / h < 1.1;
      camera.position.set(0, ancho ? 9.5 : 7.6, ancho ? 14.5 : 12.6);
      if (w > 900) camera.setViewOffset(w, h, -w * 0.16, 0, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
    encuadre(k.size().w, k.size().h);
    k.onResize(encuadre);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cbb5, 1.25));
    const sol = new THREE.DirectionalLight(0xfff1dc, 1.7);
    sol.position.set(5, 9, 6);
    scene.add(sol);
    const contra = new THREE.DirectionalLight(0xcfe6ff, 0.5);
    contra.position.set(-6, 4, -5);
    scene.add(contra);

    const mundo = new THREE.Group();
    mundo.position.x = 0.35;
    scene.add(mundo);
    const lam = (c: THREE.ColorRepresentation) => track(new THREE.MeshLambertMaterial({ color: c }));
    const pho = (c: THREE.ColorRepresentation, sh = 40) => track(new THREE.MeshPhongMaterial({ color: c, shininess: sh }));

    // tablero
    const tablero = new THREE.Mesh(new RoundedBoxGeometry(10, 0.5, 6.6, 4, 0.28), lam(cssColor("--sand-2", "#ece3d5")));
    tablero.position.y = -0.25;
    mundo.add(tablero);
    const borde = new THREE.Mesh(new RoundedBoxGeometry(10.3, 0.3, 6.9, 4, 0.2), lam(cssColor("--sand-3", "#d9ccb7")));
    borde.position.y = -0.55;
    mundo.add(borde);
    const s0 = sombra(13, 9, 0.22);
    s0.position.y = -0.72;
    mundo.add(s0);

    // pasto y agua detrás
    const pasto = new THREE.Mesh(new RoundedBoxGeometry(6.2, 0.08, 2.6, 2, 0.04), lam(0x9db58a));
    pasto.position.set(-1.6, 0.04, -1.75);
    mundo.add(pasto);
    const agua = new THREE.Mesh(new RoundedBoxGeometry(3.2, 0.06, 2.6, 2, 0.03), pho(0x7fb2c1, 90));
    agua.position.set(3.25, 0.03, -1.75);
    mundo.add(agua);

    const pinoGeo = track(new THREE.ConeGeometry(0.28, 0.9, 7));
    const troncoGeo = track(new THREE.CylinderGeometry(0.05, 0.06, 0.25, 6));
    const pinoMat = lam(0x3f6b4f);
    const troncoMat = lam(0x6b4a33);
    const pino = (x: number, z: number, e = 1) => {
      const g = new THREE.Group();
      const t = new THREE.Mesh(troncoGeo, troncoMat);
      t.position.y = 0.12;
      const c = new THREE.Mesh(pinoGeo, pinoMat);
      c.position.y = 0.65;
      g.add(t, c);
      g.scale.setScalar(e);
      g.position.set(x, 0.05, z);
      mundo.add(g);
    };
    [[-4.4, -2.6, 1.1], [-3.7, -1.0, 0.9], [-2.2, -2.75, 1.2], [-0.9, -2.7, 0.95], [-4.6, -1.5, 0.8], [-0.4, -1.1, 0.75], [-2.9, -0.65, 0.7]].forEach(([x, z, e]) => pino(x, z, e));

    // cabaña de troncos
    const cab = new THREE.Group();
    const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.62, 0.86), lam(0x8a5a3b));
    cuerpo.position.y = 0.31;
    const tch = new THREE.Mesh(techo(1.32, 0.55, 1.0), lam(0x4a3a33));
    tch.position.y = 0.62;
    tch.rotation.y = Math.PI / 2;
    const puerta = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.34), lam(0x5b3a24));
    puerta.position.set(0, 0.17, 0.431);
    cab.add(cuerpo, tch, puerta);
    cab.position.set(-3.1, 0.05, -1.75);
    cab.rotation.y = 0.25;
    mundo.add(cab);
    const sc = sombra(1.9, 1.5);
    sc.position.set(-3.1, 0.07, -1.7);
    mundo.add(sc);

    // cabaña en A
    const aGrupo = new THREE.Group();
    const a = new THREE.Mesh(techo(1.0, 1.15, 0.95), lam(0x3b3f44));
    const vidrio = new THREE.Mesh(new THREE.CircleGeometry(0.42, 3).rotateZ(Math.PI / 2), pho(0x9fd1d6, 120));
    vidrio.position.set(0, 0.3, 0.49);
    vidrio.scale.set(1, 0.95, 1);
    aGrupo.add(a, vidrio);
    aGrupo.rotation.y = -0.35 + Math.PI / 2;
    aGrupo.position.set(-1.45, 0.05, -2.0);
    mundo.add(aGrupo);
    const sa = sombra(1.5, 1.4);
    sa.position.set(-1.45, 0.07, -2.0);
    mundo.add(sa);

    // edificio frente al mar, con el 2A y el 2B marcados
    const edif = new THREE.Group();
    const blanco = lam(0xf4efe7);
    const bloque = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.9, 0.95), blanco);
    bloque.position.y = 0.95;
    edif.add(bloque);
    const losa = track(new THREE.BoxGeometry(1.35, 0.05, 0.22));
    for (let i = 1; i <= 3; i++) {
      const l = new THREE.Mesh(losa, blanco);
      l.position.set(0, i * 0.45, 0.56);
      edif.add(l);
    }
    const vent = track(new THREE.PlaneGeometry(0.42, 0.26));
    const tonoA = cssColor("--accent", "#1f6f6b");
    const tonoB = cssColor("--clay", "#c2643f");
    for (let f = 0; f < 4; f++) {
      for (let c = 0; c < 2; c++) {
        const marcado = f === 1;
        const m = new THREE.Mesh(vent, marcado ? pho(c === 0 ? tonoA : tonoB, 60) : pho(0x9cb8c4, 100));
        m.position.set(c === 0 ? -0.29 : 0.29, 0.25 + f * 0.45, 0.477);
        edif.add(m);
      }
    }
    edif.position.set(1.15, 0.05, -1.95);
    mundo.add(edif);
    const se = sombra(2.0, 1.6, 0.3);
    se.position.set(1.15, 0.07, -1.9);
    mundo.add(se);

    // las dos casas gemelas sobre la arena
    const arena = new THREE.Mesh(new RoundedBoxGeometry(2.6, 0.06, 1.0, 2, 0.03), lam(0xe6d3ad));
    arena.position.set(3.25, 0.07, -0.95);
    mundo.add(arena);
    const gemela = (x: number) => {
      const g = new THREE.Group();
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.62, 0.66), blanco);
      c.position.y = 0.31;
      const t = new THREE.Mesh(techo(0.78, 0.42, 0.74), lam(0x5f7b8f));
      t.position.y = 0.62;
      t.rotation.y = Math.PI / 2;
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.04, 0.16), lam(0xe9e3d8));
      b.position.set(0, 0.36, 0.38);
      g.add(c, t, b);
      g.position.set(x, 0.05, -2.05);
      mundo.add(g);
      const sg = sombra(1.1, 1.0);
      sg.position.set(x, 0.07, -2.0);
      mundo.add(sg);
    };
    gemela(2.75);
    gemela(3.75);

    // el calendario: 7 columnas por 3 filas de noches
    const fichaGeo = track(new RoundedBoxGeometry(1.08, 0.2, 0.78, 2, 0.08));
    const cReserva = cssColor("--booked", "#1f6f6b");
    const cBloqueo = cssColor("--warn", "#d4952a");
    const cCargado = cssColor("--ok", "#2f8a57");
    const cLibre = cssColor("--free", "#e7ddcd");
    const RES = new Set([0, 1, 2, 5, 6, 9, 10, 11, 14, 17, 18, 20]);
    const BLO = [3, 4, 8, 12, 13, 16];
    type F = { mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; giro: number; estado: "r" | "b" | "c" | "l"; i: number };
    const fichas: F[] = [];
    for (let i = 0; i < 21; i++) {
      const col = i % 7;
      const fila = Math.floor(i / 7);
      const mat = track(new THREE.MeshLambertMaterial({ color: cLibre }));
      const m = new THREE.Mesh(fichaGeo, mat);
      m.position.set(-3.75 + col * 1.25, 0.12, 0.35 + fila * 0.95);
      mundo.add(m);
      const estado = RES.has(i) ? "r" : BLO.includes(i) ? "b" : "l";
      mat.color.copy(estado === "r" ? cReserva : estado === "b" ? cBloqueo : cLibre);
      fichas.push({ mesh: m, mat, giro: 0, estado, i });
    }
    const sf = sombra(10, 3.6, 0.12);
    sf.position.set(0, 0.03, 1.3);
    mundo.add(sf);

    // fotos reales de la cartera, flotando sobre el tablero
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const marcoGeo = track(new THREE.PlaneGeometry(1.86, 1.36));
    const fotoGeo = track(new THREE.PlaneGeometry(1.7, 1.2));
    const fotos = [
      { key: "troncos", pos: [-2.9, 2.6, -2.6], rot: 0.18 },
      { key: "dunas", pos: [0.2, 3.25, -3.1], rot: -0.04 },
      { key: "balcon", pos: [3.2, 2.55, -2.5], rot: -0.2 },
    ].filter((_, i) => !chico || i !== 1);
    const tarjetas = fotos.map((f, i) => {
      const g = new THREE.Group();
      const marco = new THREE.Mesh(marcoGeo, lam(0xffffff));
      const mat = track(new THREE.MeshBasicMaterial({ color: 0xe8e0d2 }));
      const ph = new THREE.Mesh(fotoGeo, mat);
      ph.position.z = 0.01;
      g.add(marco, ph);
      g.position.set(f.pos[0], f.pos[1], f.pos[2]);
      g.rotation.y = f.rot;
      mundo.add(g);
      loader.load(foto(f.key, 420, 300), (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        track(tex);
        mat.map = tex;
        mat.color.set(0xffffff);
        mat.needsUpdate = true;
      });
      return { g, base: g.position.y, i };
    });

    const ptr = { x: 0, y: 0 };
    const cur = { x: 0, y: 0, s: 0 };
    const onMove = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      ptr.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ptr.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let ola = 0;
    k.loop((dt, t) => {
      // cuántas fichas ámbar quedan, según los bloqueos pendientes
      const { pendientes: p, total: tot } = datos.current;
      const ambar = tot ? Math.round((BLO.length * p) / tot) : 0;
      fichas.forEach((f) => {
        if (f.estado === "b" || f.estado === "c") {
          const idx = BLO.indexOf(f.i);
          const quiere = idx < ambar ? "b" : "c";
          if (quiere !== f.estado) {
            f.estado = quiere;
            f.giro = 1;
          }
          if (f.giro > 0) {
            f.giro = Math.max(0, f.giro - dt * 1.6);
            f.mesh.rotation.x = (1 - f.giro) * Math.PI * 2;
            if (f.giro < 0.5) f.mat.color.copy(f.estado === "b" ? cBloqueo : cCargado);
          }
        }
      });
      cur.x = damp(cur.x, ptr.x, 2.4, dt);
      cur.y = damp(cur.y, ptr.y, 2.4, dt);
      cur.s = damp(cur.s, Math.min(window.scrollY, 900), 4, dt);
      mundo.rotation.y = (quieto ? 0 : Math.sin(t * 0.18) * 0.07) + cur.x * 0.12;
      mundo.rotation.x = cur.y * 0.04;
      const yBase = camera.aspect < 1.1 ? 9.5 : 7.6;
      camera.position.y = yBase + cur.s * 0.004;
      camera.lookAt(0, 0.2 - cur.s * 0.0015, 0);
      // una ola de sincronización recorre el calendario de izquierda a derecha
      if (!quieto) {
        ola = (t * 0.55) % 3.2;
        fichas.forEach((f) => {
          const col = f.i % 7;
          const dx = ola * 3 - col;
          const bump = Math.max(0, 1 - Math.abs(dx)) * 0.12;
          f.mesh.position.y = 0.12 + bump;
        });
        tarjetas.forEach((c) => (c.g.position.y = c.base + Math.sin(t * 0.7 + c.i * 2) * 0.12));
      }
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("pointermove", onMove);
      k.dispose();
    };
  }, []);

  return <div ref={ref} className="hero-canvas" aria-hidden="true" />;
}
