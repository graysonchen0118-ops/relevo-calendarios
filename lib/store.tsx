"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { hora, overlaps, sleep } from "./format";
import { ANUNCIOS, EMPAREJADO_INICIAL, PROPIEDADES } from "./mock/propiedades";
import { BLOQUEOS } from "./mock/bloqueos";
import { generarChoques, generarReservas, generarTarifas } from "./mock/generar";
import type { Actividad, Bloqueo, DB, Toast } from "./types";

const CLAVE = "relevo-traspaso-v1";

const ACT_INICIAL: Actividad[] = [
  { id: "a3", hora: "09:42", texto: "Cabaña del Bosque y Casa Duna: tarifas de las fiestas importadas y revisadas.", tono: "ok" },
  { id: "a2", hora: "09:15", texto: "Cuenta de Airbnb leída: 12 anuncios, todos publicados.", tono: "info" },
  { id: "a1", hora: "09:02", texto: "12 propiedades creadas en Smoobu con sus fotos y capacidad.", tono: "ok" },
];

function semilla(): DB {
  const bloqueos = BLOQUEOS.map((b) => ({ ...b }));
  return {
    props: PROPIEDADES,
    anuncios: ANUNCIOS,
    emparejado: JSON.parse(JSON.stringify(EMPAREJADO_INICIAL)),
    reservas: generarReservas(bloqueos),
    bloqueos,
    tarifas: generarTarifas(),
    inventarioFirmado: false,
    conexion: { estado: "sin-conectar", paso: 0 },
    choques: [],
    resueltas: {},
    actividad: ACT_INICIAL,
  };
}

const pulso = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("relevo:pulso"));
};

interface Ctx {
  db: DB | null;
  ocupado: Record<string, boolean>;
  toasts: Toast[];
  fecharToast: (id: number) => void;
  firmarInventario: () => Promise<void>;
  cargarBloqueo: (id: string) => Promise<void>;
  cargarTodos: () => Promise<void>;
  guardarBloqueo: (b: Omit<Bloqueo, "id" | "estado"> & { id?: string }) => Promise<string | null>;
  borrarBloqueo: (id: string) => Promise<void>;
  emparejar: (anuncio: string, prop: string | null) => void;
  comprobar: (anuncio: string) => Promise<void>;
  comprobarTodos: () => Promise<void>;
  importarTarifas: (prop: string) => Promise<void>;
  fijarPrecio: (prop: string, fecha: string, valor: number) => void;
  revisarAltas: (prop: string) => Promise<void>;
  conectar: () => Promise<void>;
  resolver: (filaId: string, texto: string) => Promise<void>;
  reiniciar: () => void;
}

const C = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB | null>(null);
  const [ocupado, setOcupado] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const ref = useRef<DB | null>(null);
  ref.current = db;
  const nToast = useRef(1);

  useEffect(() => {
    let vivo = true;
    const t = setTimeout(() => {
      if (!vivo) return;
      let inicial: DB | null = null;
      try {
        const raw = window.sessionStorage.getItem(CLAVE);
        if (raw) inicial = JSON.parse(raw) as DB;
      } catch {
        inicial = null;
      }
      setDb(inicial ?? semilla());
    }, 650);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!db) return;
    try {
      window.sessionStorage.setItem(CLAVE, JSON.stringify(db));
    } catch {
      /* sin almacenamiento, la sesión sigue en memoria */
    }
  }, [db]);

  const toast = useCallback((tono: Toast["tono"], texto: string) => {
    const id = nToast.current++;
    setToasts((t) => [...t.slice(-3), { id, tono, texto }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  const fecharToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const anotar = (d: DB, texto: string, tono: Actividad["tono"]): DB => ({
    ...d,
    actividad: [{ id: `a${Date.now()}${Math.random().toString(36).slice(2, 6)}`, hora: hora(new Date()), texto, tono }, ...d.actividad].slice(0, 40),
  });

  const ocupar = (k: string, v: boolean) => setOcupado((o) => ({ ...o, [k]: v }));
  const nombreProp = (id: string | null | undefined) => PROPIEDADES.find((p) => p.id === id)?.nombre ?? "";
  const nombreAnuncio = (id: string) => nombreProp(ANUNCIOS.find((a) => a.id === id)?.real);

  const firmarInventario = useCallback(async () => {
    ocupar("inventario", true);
    await sleep(800);
    setDb((d) => (d ? anotar({ ...d, inventarioFirmado: true }, "Inventario de Airbnb firmado: reservas, bloqueos y precios en una sola lista.", "ok") : d));
    ocupar("inventario", false);
    toast("ok", "Inventario firmado. Ya es la foto oficial de la cuenta antes del traspaso.");
    pulso();
  }, [toast]);

  const cargarBloqueo = useCallback(
    async (id: string) => {
      ocupar(id, true);
      await sleep(700);
      setDb((d) => {
        if (!d) return d;
        const b = d.bloqueos.find((x) => x.id === id);
        if (!b) return d;
        return anotar({ ...d, bloqueos: d.bloqueos.map((x) => (x.id === id ? { ...x, estado: "cargado" } : x)) }, `Bloqueo cargado en Smoobu: ${nombreAnuncio(b.anuncio)}, ${b.nota.split(",")[0].replace(/\.$/, "")}.`, "ok");
      });
      ocupar(id, false);
      toast("ok", "Bloqueo cargado en Smoobu. Esas noches ya no vuelven a la venta.");
      pulso();
    },
    [toast],
  );

  const cargarTodos = useCallback(async () => {
    const d0 = ref.current;
    if (!d0) return;
    const n = d0.bloqueos.filter((b) => b.estado === "solo-airbnb").length;
    if (!n) return;
    ocupar("todos", true);
    await sleep(1200);
    setDb((d) => (d ? anotar({ ...d, bloqueos: d.bloqueos.map((x) => ({ ...x, estado: "cargado" as const })) }, `${n} bloqueos cargados en Smoobu de una vez.`, "ok") : d));
    ocupar("todos", false);
    toast("ok", `${n} bloqueos cargados. El calendario de Smoobu ya tiene todas las noches cerradas a mano.`);
    pulso();
  }, [toast]);

  const guardarBloqueo = useCallback(
    async (b: Omit<Bloqueo, "id" | "estado"> & { id?: string }) => {
      const d0 = ref.current;
      if (!d0) return "Todavía cargando.";
      if (!b.inicio || !b.fin || b.fin <= b.inicio) return "La fecha de salida tiene que ser posterior a la de entrada.";
      const res = d0.reservas.find((r) => r.anuncio === b.anuncio && overlaps(r.entrada, r.salida, b.inicio, b.fin));
      if (res) return `Esas noches ya tienen la reserva de ${res.huesped} en Airbnb.`;
      const otro = d0.bloqueos.find((x) => x.id !== b.id && x.anuncio === b.anuncio && overlaps(x.inicio, x.fin, b.inicio, b.fin));
      if (otro) return "Ya hay otro bloqueo en esas noches para la misma propiedad.";
      ocupar("guardar", true);
      await sleep(650);
      setDb((d) => {
        if (!d) return d;
        if (b.id) {
          return anotar({ ...d, bloqueos: d.bloqueos.map((x) => (x.id === b.id ? { ...x, ...b, id: x.id, estado: x.estado } : x)) }, `Bloqueo editado: ${nombreAnuncio(b.anuncio)}.`, "info");
        }
        const max = d.bloqueos.reduce((m, x) => Math.max(m, Number(x.id.slice(1)) || 0), 0);
        const nuevo: Bloqueo = { ...b, id: `B${String(max + 1).padStart(2, "0")}`, estado: "solo-airbnb" };
        return anotar({ ...d, bloqueos: [...d.bloqueos, nuevo] }, `Bloqueo nuevo anotado: ${nombreAnuncio(b.anuncio)}, ${b.motivo.toLowerCase()}.`, "warn");
      });
      ocupar("guardar", false);
      toast("ok", b.id ? "Cambios guardados." : "Bloqueo anotado. Falta cargarlo en Smoobu.");
      return null;
    },
    [toast],
  );

  const borrarBloqueo = useCallback(
    async (id: string) => {
      ocupar(id, true);
      await sleep(500);
      setDb((d) => (d ? anotar({ ...d, bloqueos: d.bloqueos.filter((x) => x.id !== id) }, "Bloqueo eliminado del inventario.", "info") : d));
      ocupar(id, false);
      toast("info", "Bloqueo eliminado.");
    },
    [toast],
  );

  const emparejar = useCallback(
    (anuncio: string, prop: string | null) => {
      const d0 = ref.current;
      if (!d0) return;
      const anterior = d0.emparejado[anuncio]?.prop ?? null;
      const otro = prop ? Object.entries(d0.emparejado).find(([k, v]) => k !== anuncio && v.prop === prop)?.[0] : undefined;
      setDb((d) => {
        if (!d) return d;
        const emp = { ...d.emparejado, [anuncio]: { prop, check: "pendiente" as const } };
        if (otro) emp[otro] = { prop: anterior, check: "pendiente" };
        return anotar({ ...d, emparejado: emp }, otro ? `Intercambio: ${nombreProp(prop)} y ${nombreProp(anterior) || "el anuncio libre"} cambiaron de anuncio.` : `Anuncio emparejado con ${nombreProp(prop) || "ninguna propiedad"}.`, "info");
      });
      if (otro) toast("info", `${nombreProp(prop)} estaba en otro anuncio. Se intercambiaron, falta comprobar los dos.`);
    },
    [toast],
  );

  const comprobar = useCallback(
    async (anuncio: string) => {
      const d0 = ref.current;
      if (!d0) return;
      const e = d0.emparejado[anuncio];
      if (!e?.prop) {
        toast("err", "Primero elija la propiedad de Smoobu para ese anuncio.");
        return;
      }
      ocupar(`chk-${anuncio}`, true);
      await sleep(900);
      const real = ANUNCIOS.find((a) => a.id === anuncio)!.real;
      const ok = e.prop === real;
      setDb((d) => (d ? anotar({ ...d, emparejado: { ...d.emparejado, [anuncio]: { prop: e.prop, check: ok ? "ok" : "error" } } }, ok ? `Reserva testigo en su fila: ${nombreProp(e.prop)}.` : `La reserva testigo del anuncio de ${nombreProp(real)} cayó en ${nombreProp(e.prop)}.`, ok ? "ok" : "err") : d));
      ocupar(`chk-${anuncio}`, false);
      if (ok) pulso();
      else toast("err", `No coincide: la reserva testigo es de ${nombreProp(real)} y caería en ${nombreProp(e.prop)}.`);
    },
    [toast],
  );

  const comprobarTodos = useCallback(async () => {
    const d0 = ref.current;
    if (!d0) return;
    ocupar("chk-todos", true);
    await sleep(1300);
    const base = ref.current ?? d0;
    const emp = { ...base.emparejado };
    let bien = 0;
    let mal = 0;
    let libres = 0;
    Object.entries(emp).forEach(([k, v]) => {
      if (!v.prop) {
        libres++;
        return;
      }
      const ok = v.prop === ANUNCIOS.find((a) => a.id === k)!.real;
      emp[k] = { prop: v.prop, check: ok ? "ok" : "error" };
      if (ok) bien++;
      else mal++;
    });
    setDb((d) => (d ? anotar({ ...d, emparejado: emp }, `Comprobación general: ${bien} en su fila, ${mal} cruzados, ${libres} sin elegir.`, mal ? "err" : "ok") : d));
    ocupar("chk-todos", false);
    toast(mal ? "err" : libres ? "info" : "ok", mal ? `${mal} anuncios cruzados. Revise los marcados en rojo.` : libres ? `Todo lo emparejado está bien. Faltan ${libres} anuncios por elegir.` : "Todas las reservas testigo cayeron en su fila.");
    pulso();
  }, [toast]);

  const importarTarifas = useCallback(
    async (prop: string) => {
      const d0 = ref.current;
      if (!d0) return;
      const anuncio = ANUNCIOS.find((a) => a.real === prop)!;
      const emp = d0.emparejado[anuncio.id];
      if (!emp?.prop || emp.prop !== prop || emp.check !== "ok") {
        toast("err", "Primero empareje y compruebe el anuncio de esta propiedad, si no las tarifas caen en otra.");
        return;
      }
      ocupar(`imp-${prop}`, true);
      await sleep(1000);
      setDb((d) => {
        if (!d) return d;
        const t = d.tarifas[prop];
        return anotar({ ...d, tarifas: { ...d.tarifas, [prop]: { ...t, importada: true, noches: t.noches.map((n) => ({ ...n, smoobu: n.smoobu ?? n.airbnb })) } } }, `Tarifas traídas de Airbnb: ${nombreProp(prop)}.`, "ok");
      });
      ocupar(`imp-${prop}`, false);
      toast("ok", "Tarifas traídas. Las noches altas quedan marcadas para revisar una por una.");
      pulso();
    },
    [toast],
  );

  const fijarPrecio = useCallback(
    (prop: string, fecha: string, valor: number) => {
      setDb((d) => {
        if (!d) return d;
        const t = d.tarifas[prop];
        return anotar({ ...d, tarifas: { ...d.tarifas, [prop]: { ...t, noches: t.noches.map((n) => (n.fecha === fecha ? { ...n, smoobu: valor, revisada: true } : n)) } } }, `Precio revisado: ${nombreProp(prop)}, ${fecha.slice(8)}/${fecha.slice(5, 7)} en USD ${valor}.`, "ok");
      });
      toast("ok", "Noche revisada.");
      pulso();
    },
    [toast],
  );

  const revisarAltas = useCallback(
    async (prop: string) => {
      const d0 = ref.current;
      if (!d0 || !d0.tarifas[prop].importada) {
        toast("err", "Primero traiga las tarifas de Airbnb para esta propiedad.");
        return;
      }
      ocupar(`rev-${prop}`, true);
      await sleep(700);
      setDb((d) => {
        if (!d) return d;
        const t = d.tarifas[prop];
        return anotar({ ...d, tarifas: { ...d.tarifas, [prop]: { ...t, noches: t.noches.map((n) => (n.alta ? { ...n, revisada: true } : n)) } } }, `Noches altas revisadas: ${nombreProp(prop)}.`, "ok");
      });
      ocupar(`rev-${prop}`, false);
      toast("ok", "Noches altas revisadas.");
      pulso();
    },
    [toast],
  );

  const conectar = useCallback(async () => {
    const d0 = ref.current;
    if (!d0 || d0.conexion.estado !== "sin-conectar") return;
    for (let paso = 1; paso <= 4; paso++) {
      setDb((d) => (d ? { ...d, conexion: { ...d.conexion, estado: "conectando", paso } } : d));
      await sleep(paso === 3 ? 1300 : 900);
    }
    setDb((d) => {
      if (!d) return d;
      const mapa: Record<string, string | null> = {};
      Object.entries(d.emparejado).forEach(([k, v]) => (mapa[k] = v.prop));
      const cargados = d.bloqueos.filter((b) => b.estado === "cargado").map((b) => b.id);
      const choques = generarChoques(d.bloqueos);
      const n = d.bloqueos.length - cargados.length;
      return anotar(
        { ...d, conexion: { estado: "conectada", paso: 4, fecha: new Date().toISOString(), foto: { mapa, cargados } }, choques },
        n ? `Conectado con ${n} bloqueos sin cargar: ${choques.length} noches ya se vendieron de nuevo en Airbnb.` : "Conectado. La primera sincronización salió con todos los bloqueos puestos.",
        n ? "err" : "ok",
      );
    });
    pulso();
  }, []);

  const resolver = useCallback(
    async (filaId: string, texto: string) => {
      ocupar(`fila-${filaId}`, true);
      await sleep(750);
      setDb((d) => {
        if (!d) return d;
        let nd: DB = { ...d, resueltas: { ...d.resueltas, [filaId]: texto } };
        const r = d.reservas.find((x) => x.id === filaId);
        if (r) {
          const real = ANUNCIOS.find((a) => a.id === r.anuncio)!.real;
          nd = { ...nd, emparejado: { ...nd.emparejado, [r.anuncio]: { prop: real, check: "ok" } } };
        }
        const b = d.bloqueos.find((x) => x.id === filaId);
        if (b) nd = { ...nd, bloqueos: nd.bloqueos.map((x) => (x.id === filaId ? { ...x, estado: "cargado" } : x)) };
        const c = d.choques.find((x) => x.id === filaId);
        if (c) nd = { ...nd, bloqueos: nd.bloqueos.map((x) => (x.id === c.choqueCon ? { ...x, estado: "cargado" } : x)) };
        return anotar(nd, `Cuadre: ${texto}`, c ? "warn" : "ok");
      });
      ocupar(`fila-${filaId}`, false);
      toast("ok", "Fila cuadrada.");
      pulso();
    },
    [toast],
  );

  const reiniciar = useCallback(() => {
    try {
      window.sessionStorage.removeItem(CLAVE);
    } catch {
      /* nada que borrar */
    }
    setDb(null);
    setTimeout(() => setDb(semilla()), 550);
    toast("info", "Escenario restablecido: la cuenta vuelve al punto de partida.");
  }, [toast]);

  const value = useMemo(
    () => ({ db, ocupado, toasts, fecharToast, firmarInventario, cargarBloqueo, cargarTodos, guardarBloqueo, borrarBloqueo, emparejar, comprobar, comprobarTodos, importarTarifas, fijarPrecio, revisarAltas, conectar, resolver, reiniciar }),
    [db, ocupado, toasts, fecharToast, firmarInventario, cargarBloqueo, cargarTodos, guardarBloqueo, borrarBloqueo, emparejar, comprobar, comprobarTodos, importarTarifas, fijarPrecio, revisarAltas, conectar, resolver, reiniciar],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useStore() {
  const v = useContext(C);
  if (!v) throw new Error("useStore fuera del proveedor");
  return v;
}
