import { diffDays, nightsOf, overlaps } from "./format";
import { FIESTAS_FIN, FIESTAS_INI } from "./mock/generar";
import type { Bloqueo, DB, FilaCuadre, Noche, Propiedad, Reserva } from "./types";

export type Celda = "libre" | "reserva" | "bloqueo" | "cargado" | "reabierta" | "choque" | "precio" | "cruzada";

export const NOCHES_FIESTAS = nightsOf(FIESTAS_INI, FIESTAS_FIN);

const anuncioReal = (db: DB, propId: string) => db.anuncios.find((a) => a.real === propId)!;

/** noches de una propiedad que ya tienen dueño: reserva de Airbnb o bloqueo a mano */
export function ocupadas(db: DB, propId: string) {
  const a = anuncioReal(db, propId);
  const s = new Set<string>();
  db.reservas.forEach((r) => r.anuncio === a.id && nightsOf(r.entrada, r.salida).forEach((d) => s.add(d)));
  db.bloqueos.forEach((b) => b.anuncio === a.id && nightsOf(b.inicio, b.fin).forEach((d) => s.add(d)));
  return s;
}

/** noches altas todavía a la venta: las únicas cuyo precio decide Smoobu */
export const altasLibres = (db: DB, propId: string) => {
  const occ = ocupadas(db, propId);
  return db.tarifas[propId].noches.filter((n) => n.alta && !occ.has(n.fecha));
};

/** el calendario de las fiestas, fila por propiedad: hoy en Airbnb, o lo que Smoobu publicaría al conectar */
export function celdasFiestas(db: DB, fase: "hoy" | "despues") {
  return db.props.map((p) => {
    const a = anuncioReal(db, p.id);
    const emp = db.emparejado[a.id];
    const bien = emp?.prop === p.id;
    const res = db.reservas.filter((r) => r.anuncio === a.id && overlaps(r.entrada, r.salida, FIESTAS_INI, FIESTAS_FIN));
    const blo = db.bloqueos.filter((b) => b.anuncio === a.id && overlaps(b.inicio, b.fin, FIESTAS_INI, FIESTAS_FIN));
    const tarifa = db.tarifas[p.id];
    const celdas: Celda[] = NOCHES_FIESTAS.map((d) => {
      if (res.some((r) => r.entrada <= d && d < r.salida)) return fase === "despues" && !bien ? "cruzada" : "reserva";
      const b = blo.find((x) => x.inicio <= d && d < x.fin);
      if (b) {
        if (b.estado === "cargado") return "cargado";
        if (fase === "hoy") return "bloqueo";
        return b.choque ? "choque" : "reabierta";
      }
      if (fase === "despues") {
        const n = tarifa?.noches.find((x) => x.fecha === d);
        if (n && n.alta && (n.smoobu === null || !n.revisada)) return "precio";
      }
      return "libre";
    });
    return { prop: p, celdas };
  });
}

export interface Simulacion {
  reabiertas: { bloqueo: Bloqueo; noches: number }[];
  nochesReabiertas: number;
  choques: Bloqueo[];
  precioBase: { prop: Propiedad; noches: Noche[] }[];
  nochesPrecioBase: number;
  sinRevisar: number;
  cruzadas: Reserva[];
  fueraDeSmoobu: Reserva[];
  sinComprobar: number;
  limpio: boolean;
}

/** qué pasaría si se conecta ahora mismo, con lo que hay cargado */
export function simular(db: DB): Simulacion {
  const pendientes = db.bloqueos.filter((b) => b.estado === "solo-airbnb");
  const reabiertas = pendientes.map((b) => ({ bloqueo: b, noches: diffDays(b.inicio, b.fin) }));
  const precioBase = db.props
    .map((p) => ({ prop: p, noches: altasLibres(db, p.id).filter((n) => n.smoobu === null) }))
    .filter((x) => x.noches.length);
  const sinRevisar = db.props.reduce((s, p) => s + altasLibres(db, p.id).filter((n) => n.smoobu !== null && !n.revisada).length, 0);
  const cruzadas: Reserva[] = [];
  const fuera: Reserva[] = [];
  db.reservas.forEach((r) => {
    const a = db.anuncios.find((x) => x.id === r.anuncio)!;
    const e = db.emparejado[r.anuncio];
    if (!e?.prop) fuera.push(r);
    else if (e.prop !== a.real) cruzadas.push(r);
  });
  const sinComprobar = Object.values(db.emparejado).filter((e) => e.check !== "ok").length;
  const nochesReabiertas = reabiertas.reduce((s, x) => s + x.noches, 0);
  const nochesPrecioBase = precioBase.reduce((s, x) => s + x.noches.length, 0);
  return {
    reabiertas,
    nochesReabiertas,
    choques: pendientes.filter((b) => b.choque),
    precioBase,
    nochesPrecioBase,
    sinRevisar,
    cruzadas,
    fueraDeSmoobu: fuera,
    sinComprobar,
    limpio: !reabiertas.length && !nochesPrecioBase && !sinRevisar && !cruzadas.length && !fuera.length && !sinComprobar,
  };
}

/** después de conectar: cada reserva y cada bloqueo de Airbnb contra lo que muestra Smoobu */
export function filasCuadre(db: DB): FilaCuadre[] {
  const foto = db.conexion.foto;
  if (!foto) return [];
  const filas: FilaCuadre[] = [];
  const nombre = (id: string | null | undefined) => db.props.find((p) => p.id === id)?.nombre ?? "sin propiedad";
  db.reservas.forEach((r) => {
    const a = db.anuncios.find((x) => x.id === r.anuncio)!;
    const m = foto.mapa[r.anuncio];
    const estado = !m ? "sin-importar" : m !== a.real ? "otra-fila" : "ok";
    filas.push({
      id: r.id,
      tipo: "reserva",
      anuncio: r.anuncio,
      prop: a.real,
      titulo: r.huesped,
      detalle: estado === "ok" ? `Reserva ${r.codigo}, en su fila` : estado === "otra-fila" ? `Reserva ${r.codigo}, cayó en la fila de ${nombre(m)}` : `Reserva ${r.codigo}, el anuncio no se emparejó y no entró a Smoobu`,
      inicio: r.entrada,
      fin: r.salida,
      estado,
      resuelta: db.resueltas[r.id],
    });
  });
  db.bloqueos.forEach((b) => {
    const a = db.anuncios.find((x) => x.id === b.anuncio)!;
    const cargado = foto.cargados.includes(b.id);
    const choque = db.choques.find((c) => c.choqueCon === b.id);
    if (choque) {
      filas.push({
        id: choque.id,
        tipo: "choque",
        anuncio: b.anuncio,
        prop: a.real,
        titulo: `${choque.huesped} entró sobre: ${b.nota.split(",")[0].replace(/\.$/, "")}`,
        detalle: `Airbnb vendió de nuevo noches que estaban bloqueadas por ${b.motivo.toLowerCase()}`,
        inicio: b.inicio,
        fin: b.fin,
        estado: "choque",
        resuelta: db.resueltas[choque.id],
      });
      return;
    }
    filas.push({
      id: b.id,
      tipo: "bloqueo",
      anuncio: b.anuncio,
      prop: a.real,
      titulo: b.nota.split(",")[0].replace(/\.$/, ""),
      detalle: cargado ? `Bloqueo por ${b.motivo.toLowerCase()}, cargado antes de conectar` : `Bloqueo por ${b.motivo.toLowerCase()}, volvió a la venta en Airbnb`,
      inicio: b.inicio,
      fin: b.fin,
      estado: cargado ? "ok" : "reabierta",
      resuelta: db.resueltas[b.id],
    });
  });
  return filas.sort((x, y) => (x.inicio < y.inicio ? -1 : x.inicio > y.inicio ? 1 : 0));
}

export interface Pasos {
  inventario: boolean;
  emparejado: { hechos: number; total: number; listo: boolean };
  carga: { bloqueos: number; totalBloqueos: number; altas: number; totalAltas: number; listo: boolean };
  conexion: boolean;
  cuadre: { hechas: number; total: number; listo: boolean };
}

export function pasos(db: DB): Pasos {
  const emp = Object.values(db.emparejado);
  const hechosEmp = emp.filter((e) => e.prop && e.check === "ok").length;
  const cargados = db.bloqueos.filter((b) => b.estado === "cargado").length;
  let altas = 0;
  let totalAltas = 0;
  db.props.forEach((p) =>
    altasLibres(db, p.id).forEach((n) => {
      totalAltas++;
      if (n.smoobu !== null && n.revisada) altas++;
    }),
  );
  const filas = filasCuadre(db);
  const hechas = filas.filter((f) => f.estado === "ok" || f.resuelta).length;
  return {
    inventario: db.inventarioFirmado,
    emparejado: { hechos: hechosEmp, total: emp.length, listo: hechosEmp === emp.length },
    carga: { bloqueos: cargados, totalBloqueos: db.bloqueos.length, altas, totalAltas, listo: cargados === db.bloqueos.length && altas === totalAltas },
    conexion: db.conexion.estado === "conectada",
    cuadre: { hechas, total: filas.length, listo: filas.length > 0 && hechas === filas.length },
  };
}
