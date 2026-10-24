"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { cssColor, damp, montar, rotulo, sombra } from "./kit";
import type { Celda } from "@/lib/sim";
import { fechaCorta } from "@/lib/format";

export interface FilaEscena {
  nombre: string;
  celdas: Celda[];
}

const ALTO: Record<Celda, number> = { libre: 0.1, reserva: 0.38, bloqueo: 0.3, cargado: 0.3, reabierta: 0.1, choque: 0.38, precio: 0.17, cruzada: 0.38 };

// Las fiestas de toda la cartera en un tablero: una fila por propiedad, una ficha por noche.
// Al pasar de "hoy en Airbnb" a "después de conectar", la ola recorre las noches y se ve
// qué bloqueos vuelven a la venta y dónde dos reservas quedan apiladas en la misma noche.
export default function SyncScene({ filas, noches, onHover }: { filas: FilaEscena[]; noches: string[]; onHover?: (x: { fila: number; col: number } | null) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const actualizar = useRef<((f: FilaEscena[]) => void) | null>(null);
  const hover = useRef(onHover);
  hover.current = onHover;
  const primeras = useRef(filas);

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const k = montar(mount, { dpr: 1 });
    if (!k) return;
    const { scene, renderer, track, quieto } = k;
    const R = primeras.current.length;
    const Cn = noches.length;
    const DX = 0.52;
    const DZ = 0.62;
    const ancho = Cn * DX;
    const fondo = R * DZ;

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 140);
    // la distancia sale del ancho real del tablero con los nombres, así entra entero en cualquier pantalla
    const cx = -0.45;
    const encuadre = (w: number, h: number) => {
      camera.aspect = w / h;
      const anchoTotal = ancho + 3.5;
      const hf = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(17)) * camera.aspect);
      const d = Math.max(((anchoTotal / 2) / Math.tan(hf / 2)) * 1.06, 13.2);
      camera.position.set(cx, d * 0.69, d * 0.73 + 0.4);
      camera.lookAt(cx, 0, 0.4);
      camera.updateProjectionMatrix();
    };
    encuadre(k.size().w, k.size().h);
    k.onResize(encuadre);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cbb5, 1.2));
    const sol = new THREE.DirectionalLight(0xfff1dc, 1.6);
    sol.position.set(4, 10, 7);
    scene.add(sol);

    const grupo = new THREE.Group();
    scene.add(grupo);

    const losa = new THREE.Mesh(new RoundedBoxGeometry(ancho + 3.6, 0.3, fondo + 1.4, 3, 0.18), track(new THREE.MeshLambertMaterial({ color: cssColor("--sand-2", "#ece3d5") })));
    losa.position.set(-0.9, -0.16, 0);
    grupo.add(losa);
    const sl = sombra(ancho + 6, fondo + 4, 0.18);
    sl.position.set(-0.9, -0.32, 0.2);
    grupo.add(sl);

    const x0 = -ancho / 2 + DX / 2 + 0.6;
    const z0 = -fondo / 2 + DZ / 2;
    const geo = track(new THREE.BoxGeometry(0.44, 1, 0.46));
    const n = R * Cn;
    const celdas = new THREE.InstancedMesh(geo, track(new THREE.MeshLambertMaterial()), n);
    const arriba = new THREE.InstancedMesh(geo, track(new THREE.MeshLambertMaterial({ color: cssColor("--err", "#c23d4b") })), n);
    grupo.add(celdas, arriba);

    const COL: Record<Celda, THREE.Color> = {
      libre: cssColor("--free", "#e7ddcd"),
      reserva: cssColor("--booked", "#1f6f6b"),
      bloqueo: cssColor("--warn", "#d4952a"),
      cargado: cssColor("--ok", "#2f8a57"),
      reabierta: cssColor("--err", "#c23d4b"),
      choque: cssColor("--err", "#c23d4b"),
      precio: cssColor("--clay", "#c2643f"),
      cruzada: cssColor("--cross", "#6b5b95"),
    };

    type Est = { h: number; th: number; c: THREE.Color; tc: THREE.Color; top: number; ttop: number; t0: number };
    const est: Est[] = [];
    let reloj = 0;
    for (let r = 0; r < R; r++)
      for (let c = 0; c < Cn; c++) {
        const cel = primeras.current[r].celdas[c];
        est.push({ h: ALTO[cel], th: ALTO[cel], c: COL[cel].clone(), tc: COL[cel].clone(), top: cel === "choque" ? 1 : 0, ttop: cel === "choque" ? 1 : 0, t0: 0 });
      }

    actualizar.current = (f) => {
      for (let r = 0; r < R; r++)
        for (let c = 0; c < Cn; c++) {
          const e = est[r * Cn + c];
          const cel = f[r]?.celdas[c] ?? "libre";
          if (e.tc.equals(COL[cel]) && e.th === ALTO[cel] && e.ttop === (cel === "choque" ? 1 : 0)) continue;
          e.th = ALTO[cel];
          e.tc = COL[cel].clone();
          e.ttop = cel === "choque" ? 1 : 0;
          e.t0 = reloj + c * 0.045 + r * 0.012;
        }
    };

    // nombres de las propiedades y las noches que más pesan
    primeras.current.forEach((f, r) => {
      const { sprite } = rotulo(f.nombre, { px: 40, peso: 700, color: "#2b3640" });
      sprite.center.set(1, 0.5);
      sprite.position.set(x0 - 0.45, 0.12, z0 + r * DZ);
      grupo.add(sprite);
    });
    noches.forEach((d, c) => {
      const clave = d === "2026-12-24" || d === "2026-12-31" || c === 0 || c === Cn - 1;
      if (!clave) return;
      const txt = d === "2026-12-24" ? "Nochebuena" : d === "2026-12-31" ? "Año Nuevo" : fechaCorta(d);
      const { sprite } = rotulo(txt, { px: 38, peso: 800, color: d === "2026-12-24" || d === "2026-12-31" ? "#ffffff" : "#2b3640", fondo: d === "2026-12-24" || d === "2026-12-31" ? "#c2643f" : undefined });
      sprite.position.set(x0 + c * DX, 0.95, z0 - DZ * 1.1);
      grupo.add(sprite);
    });

    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3();
    const oculto = new THREE.Vector3(0, 0, 0);
    q.identity();

    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const ptr = { x: 0, y: 0, dentro: false };
    const cur = { x: 0, y: 0 };
    let ultimo = -1;
    const onMove = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      ptr.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ptr.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      ptr.dentro = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!ptr.dentro) {
        if (ultimo !== -1) {
          ultimo = -1;
          hover.current?.(null);
        }
        return;
      }
      ndc.set(ptr.x, -ptr.y);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObject(celdas, false)[0];
      const id = hit?.instanceId ?? -1;
      if (id !== ultimo) {
        ultimo = id;
        hover.current?.(id >= 0 ? { fila: Math.floor(id / Cn), col: id % Cn } : null);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    k.loop((dt, t) => {
      reloj = t;
      cur.x = damp(cur.x, ptr.dentro ? ptr.x : 0, 2.2, dt);
      cur.y = damp(cur.y, ptr.dentro ? ptr.y : 0, 2.2, dt);
      grupo.rotation.y = (quieto ? 0 : Math.sin(t * 0.15) * 0.025) + cur.x * 0.06;
      grupo.rotation.x = cur.y * 0.03;
      for (let r = 0; r < R; r++)
        for (let c = 0; c < Cn; c++) {
          const i = r * Cn + c;
          const e = est[i];
          const activo = t >= e.t0;
          if (activo) {
            e.h = damp(e.h, e.th, 7, dt);
            e.c.lerp(e.tc, 1 - Math.exp(-7 * dt));
            e.top = damp(e.top, e.ttop, 5, dt);
          }
          const salto = activo && Math.abs(e.h - e.th) > 0.01 ? Math.sin(Math.min(1, (t - e.t0) * 2.5) * Math.PI) * 0.25 : 0;
          v.set(x0 + c * DX, e.h / 2 + salto, z0 + r * DZ);
          s.set(1, Math.max(0.02, e.h), 1);
          m4.compose(v, q, s);
          celdas.setMatrixAt(i, m4);
          celdas.setColorAt(i, e.c);
          if (e.top > 0.02) {
            const late = quieto ? 0 : Math.sin(t * 5 + c) * 0.03;
            v.set(x0 + c * DX + 0.05, e.h + 0.17 * e.top + 0.02 + late, z0 + r * DZ - 0.04);
            s.set(0.9, 0.3 * e.top, 0.9);
            m4.compose(v, q, s);
          } else {
            m4.compose(oculto, q, s.set(0.0001, 0.0001, 0.0001));
          }
          arriba.setMatrixAt(i, m4);
        }
      celdas.instanceMatrix.needsUpdate = true;
      if (celdas.instanceColor) celdas.instanceColor.needsUpdate = true;
      arriba.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("pointermove", onMove);
      actualizar.current = null;
      k.dispose();
    };
  }, [noches]);

  useEffect(() => {
    actualizar.current?.(filas);
  }, [filas]);

  return <div ref={ref} className="sync-canvas" />;
}
