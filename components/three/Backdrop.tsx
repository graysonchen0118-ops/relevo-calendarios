"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { cssColor, damp, montar } from "./kit";
import { mulberry32 } from "@/lib/format";

// Fondo de todo el sitio: fichas de calendario y casitas que flotan en tres capas de profundidad.
// Cada capa se mueve a otra velocidad con el scroll, y la cámara sigue un poco al puntero.
// Cuando algo queda resuelto en la página, una ficha se da vuelta y se pone verde.
export default function Backdrop() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const k = montar(mount, { dpr: 1, suave: false });
    if (!k) return;
    const { scene, renderer, track, chico, quieto } = k;
    renderer.setPixelRatio(chico ? 0.9 : 0.85);
    scene.fog = new THREE.Fog(cssColor("--bg", "#f6f2ec"), 10, 34);
    const camera = new THREE.PerspectiveCamera(48, k.size().w / k.size().h, 0.1, 90);
    camera.position.set(0, 0, 16);
    k.onResize((w, h) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9ccb6, 1.15));
    const sol = new THREE.DirectionalLight(0xfff0dc, 1.2);
    sol.position.set(-4, 7, 8);
    scene.add(sol);

    const rnd = mulberry32(42);
    const ficha = track(new RoundedBoxGeometry(1.1, 1.1, 0.16, 2, 0.14));
    const casa = track(new THREE.BoxGeometry(0.8, 0.6, 0.6));
    const tejado = track(new THREE.ConeGeometry(0.62, 0.5, 4).rotateY(Math.PI / 4).translate(0, 0.55, 0));
    const tonos = [cssColor("--accent", "#1f6f6b"), cssColor("--sand-3", "#d9ccb7"), cssColor("--clay", "#c2643f"), cssColor("--warn", "#d4952a")];

    type Item = { base: THREE.Vector3; rot: THREE.Euler; giro: THREE.Vector3; tono: number; flip: number };
    const capas = [
      { n: chico ? 10 : 18, geo: ficha, mat: track(new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.32 })), z: -4 },
      { n: chico ? 6 : 10, geo: casa, mat: track(new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.26 })), z: -9 },
      { n: chico ? 8 : 14, geo: ficha, mat: track(new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.22 })), z: -15 },
    ];
    const verde = cssColor("--ok", "#2f8a57");
    const grupos = capas.map((c, ci) => {
      const mesh = new THREE.InstancedMesh(c.geo, c.mat, c.n);
      const items: Item[] = [];
      for (let i = 0; i < c.n; i++) {
        const tono = Math.floor(rnd() * tonos.length);
        items.push({
          base: new THREE.Vector3((rnd() - 0.5) * 42, (rnd() - 0.5) * 30, c.z - rnd() * 5),
          rot: new THREE.Euler((rnd() - 0.5) * 0.9, (rnd() - 0.5) * 1.2, rnd() * Math.PI),
          giro: new THREE.Vector3((rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.16, (rnd() - 0.5) * 0.08),
          tono,
          flip: 0,
        });
        mesh.setColorAt(i, tonos[tono]);
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      scene.add(mesh);
      return { mesh, items, ci };
    });
    // los techos de las casitas van como otra malla con las mismas posiciones
    const techos = new THREE.InstancedMesh(tejado, track(new THREE.MeshLambertMaterial({ color: cssColor("--clay", "#c2643f"), transparent: true, opacity: 0.26 })), capas[1].n);
    scene.add(techos);

    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3(1, 1, 1);
    const ptr = { x: 0, y: 0 };
    const cur = { x: 0, y: 0, s: 0 };
    const onMove = (e: PointerEvent) => {
      ptr.x = (e.clientX / window.innerWidth - 0.5) * 2;
      ptr.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    let empuje = 0;
    const onPulso = () => {
      empuje = 1;
      const g = grupos[0];
      const i = Math.floor(Math.random() * g.items.length);
      g.items[i].flip = 1;
      g.mesh.setColorAt(i, verde);
      if (g.mesh.instanceColor) g.mesh.instanceColor.needsUpdate = true;
    };
    window.addEventListener("relevo:pulso", onPulso);

    k.loop((dt, t) => {
      cur.x = damp(cur.x, ptr.x, 2, dt);
      cur.y = damp(cur.y, ptr.y, 2, dt);
      cur.s = damp(cur.s, window.scrollY, 5, dt);
      empuje = Math.max(0, empuje - dt * 0.8);
      camera.position.x = cur.x * 1.2;
      camera.position.y = -cur.y * 0.7;
      camera.position.z = 16 - empuje * 1.6;
      camera.lookAt(0, 0, -6);
      grupos.forEach(({ mesh, items, ci }) => {
        const vel = [0.006, 0.0035, 0.0018][ci];
        items.forEach((it, i) => {
          const flota = quieto ? 0 : Math.sin(t * 0.25 + i * 1.7) * 0.4;
          let y = it.base.y + flota + cur.s * vel;
          y = ((((y + 17) % 34) + 34) % 34) - 17;
          v.set(it.base.x, y, it.base.z);
          if (!quieto) {
            it.rot.x += it.giro.x * dt;
            it.rot.y += it.giro.y * dt * (1 + empuje * 3);
          }
          if (it.flip > 0) {
            it.flip = Math.max(0, it.flip - dt * 0.9);
            it.rot.y += dt * 9 * it.flip;
          }
          q.setFromEuler(it.rot);
          m4.compose(v, q, s);
          mesh.setMatrixAt(i, m4);
          if (ci === 1) techos.setMatrixAt(i, m4);
        });
        mesh.instanceMatrix.needsUpdate = true;
      });
      techos.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("relevo:pulso", onPulso);
      k.dispose();
    };
  }, []);

  return <div ref={ref} className="bg-canvas" aria-hidden="true" />;
}
