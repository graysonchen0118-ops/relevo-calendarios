import { addDays, diffDays, mulberry32, nightsOf, overlaps, weekday } from "../format";
import type { Bloqueo, Estadia, Noche, Propiedad, Reserva, Tarifa } from "../types";
import { ANUNCIOS, PROPIEDADES } from "./propiedades";
import { BLOQUEOS } from "./bloqueos";

const HUESPEDES: [string, string][] = [
  ["Lucía Fernández", "Argentina"], ["Camilo Restrepo", "Colombia"], ["Sofía Herrera", "México"], ["Valentina Soto", "Chile"],
  ["Ignacio Fuentes", "Chile"], ["Isabel Navarro", "España"], ["Florencia Díaz", "Uruguay"], ["Andrés Molina", "Perú"],
  ["Carolina Vega", "Ecuador"], ["Mateo Correa", "Colombia"], ["Julieta Ramos", "Argentina"], ["Sebastián Torres", "México"],
  ["Daniela Ortiz", "Paraguay"], ["Felipe Araya", "Chile"], ["Renata Castro", "Brasil"], ["Gabriel Lima", "Brasil"],
  ["Ana Souza", "Brasil"], ["Paula Ibáñez", "España"], ["Tomás Rivas", "Uruguay"], ["Martina Gil", "España"],
  ["Hannah Weber", "Alemania"], ["James Carter", "Estados Unidos"], ["Chloé Bernard", "Francia"], ["Luca Romano", "Italia"],
  ["Sarah Cohen", "Canadá"], ["Ethan Walker", "Reino Unido"], ["Mía Salazar", "Venezuela"], ["Rodrigo Peña", "Bolivia"],
  ["Elena Morales", "Costa Rica"], ["Nicolás Benítez", "Argentina"], ["Agustina Luna", "Uruguay"], ["Héctor Cabrera", "México"],
  ["Laura Medina", "Colombia"], ["Pablo Serrano", "España"], ["Victoria Rojas", "Chile"], ["Bruno Costa", "Portugal"],
  ["Inés Duarte", "Paraguay"], ["Kevin Tanaka", "Japón"], ["Olga Petrova", "Polonia"], ["Diego Cardozo", "Argentina"],
];

const ALTA_INI = "2026-12-22";
const ALTA_FIN = "2027-01-05";
export const VENTANA_INI = "2026-12-15";
export const VENTANA_FIN = "2027-01-16";
/** noches que se muestran en el calendario 3D de la conexión */
export const FIESTAS_INI = "2026-12-20";
export const FIESTAS_FIN = "2027-01-11";

export const ETIQUETAS: Record<string, string> = {
  "2026-12-24": "Nochebuena",
  "2026-12-25": "Navidad",
  "2026-12-31": "Año Nuevo",
  "2027-01-01": "1 de enero",
};

const r5 = (n: number) => Math.round(n / 5) * 5;

export const esAlta = (fecha: string) => fecha >= ALTA_INI && fecha < ALTA_FIN;

/** precio que el anuncio tiene hoy en Airbnb para esa noche */
export function precioAirbnb(p: Propiedad, fecha: string, inteligentes: boolean) {
  const wd = weekday(fecha);
  let v = wd === 5 || wd === 6 ? p.finde : p.base;
  if (esAlta(fecha)) {
    const extra: Record<string, number> = { "2026-12-24": 1.9, "2026-12-25": 1.85, "2026-12-31": 2.4, "2027-01-01": 2.0 };
    v = p.base * (extra[fecha] ?? 1.7);
  }
  if (inteligentes) {
    const rnd = mulberry32(Number(fecha.replace(/-/g, "")) + Number(p.id.slice(1)) * 97)();
    v *= 0.92 + rnd * 0.16;
  }
  return r5(v);
}

const codigo = (rnd: () => number) => {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "HM";
  for (let i = 0; i < 8; i++) s += abc[Math.floor(rnd() * abc.length)];
  return s;
};

function rangoHueco(fecha: string): [number, number] {
  if (fecha >= "2026-12-20" && fecha < "2027-01-11") return [1, 3];
  if (fecha >= "2027-01-11" && fecha < "2027-03-01") return [0, 4];
  if (fecha >= "2026-12-01") return [1, 6];
  return [2, 9];
}

function rangoNoches(fecha: string): [number, number] {
  if (fecha >= "2026-12-20" && fecha < "2027-01-11") return [2, 5];
  if (fecha >= "2027-01-11" && fecha < "2027-03-01") return [3, 7];
  return [2, 4];
}

const totalEstadia = (p: Propiedad, ini: string, fin: string, inteligentes: boolean) =>
  nightsOf(ini, fin).reduce((s, d) => s + precioAirbnb(p, d, inteligentes), 0) + p.limpieza;

/** reservas futuras hechas en Airbnb: estas sí las importa Smoobu al conectar */
export function generarReservas(bloqueos: Bloqueo[] = BLOQUEOS): Reserva[] {
  const out: Reserva[] = [];
  let n = 0;
  ANUNCIOS.forEach((a, ai) => {
    const p = PROPIEDADES.find((x) => x.id === a.real)!;
    const rnd = mulberry32(1000 + ai * 31);
    const mios = bloqueos.filter((b) => b.anuncio === a.id);
    let cur = "2026-11-01";
    const fin = "2027-03-31";
    while (cur < fin) {
      const [g0, g1] = rangoHueco(cur);
      const ini = addDays(cur, g0 + Math.floor(rnd() * (g1 - g0 + 1)));
      const [n0, n1] = rangoNoches(ini);
      const len = Math.max(p.minNoches, n0 + Math.floor(rnd() * (n1 - n0 + 1)));
      const sal = addDays(ini, len);
      if (sal > fin) break;
      const pisa = mios.find((b) => overlaps(ini, sal, b.inicio, b.fin));
      if (pisa) {
        cur = pisa.fin;
        continue;
      }
      const [huesped, pais] = HUESPEDES[Math.floor(rnd() * HUESPEDES.length)];
      n++;
      out.push({
        id: `R${String(n).padStart(3, "0")}`,
        codigo: codigo(rnd),
        anuncio: a.id,
        huesped,
        pais,
        personas: Math.max(1, Math.min(p.huespedes, 1 + Math.floor(rnd() * p.huespedes))),
        entrada: ini,
        salida: sal,
        total: totalEstadia(p, ini, sal, a.preciosInteligentes),
        creada: addDays("2026-06-20", Math.floor(rnd() * 120)),
      });
      cur = sal;
    }
  });
  return out.sort((x, y) => (x.entrada < y.entrada ? -1 : x.entrada > y.entrada ? 1 : x.anuncio < y.anuncio ? -1 : 1));
}

/** las reservas de Airbnb que entrarían sobre noches bloqueadas que volvieron a la venta */
export function generarChoques(bloqueos: Bloqueo[]): Reserva[] {
  const rnd = mulberry32(777);
  return bloqueos
    .filter((b) => b.choque && b.estado === "solo-airbnb")
    .map((b, i) => {
      const a = ANUNCIOS.find((x) => x.id === b.anuncio)!;
      const p = PROPIEDADES.find((x) => x.id === a.real)!;
      return {
        id: `C${String(i + 1).padStart(2, "0")}`,
        codigo: codigo(rnd),
        anuncio: b.anuncio,
        huesped: b.choque!.huesped,
        pais: b.choque!.pais,
        personas: b.choque!.personas,
        entrada: b.inicio,
        salida: b.fin,
        total: totalEstadia(p, b.inicio, b.fin, a.preciosInteligentes),
        creada: "2026-10-27",
        choqueCon: b.id,
      };
    });
}

export function generarTarifas(): Record<string, Tarifa> {
  const out: Record<string, Tarifa> = {};
  const importadas: Record<string, "revisadas" | "sin-revisar"> = { P01: "revisadas", P10: "revisadas", P03: "sin-revisar" };
  PROPIEDADES.forEach((p) => {
    const a = ANUNCIOS.find((x) => x.real === p.id)!;
    const imp = importadas[p.id];
    const noches: Noche[] = nightsOf(VENTANA_INI, VENTANA_FIN).map((fecha) => {
      const airbnb = precioAirbnb(p, fecha, a.preciosInteligentes);
      return { fecha, airbnb, smoobu: imp ? airbnb : null, alta: esAlta(fecha), etiqueta: ETIQUETAS[fecha], revisada: imp === "revisadas" };
    });
    out[p.id] = { prop: p.id, importada: !!imp, noches };
  });
  return out;
}

/** lo que ya pasó: Smoobu no lo trae, queda solo en Airbnb */
export function generarHistorial(): Estadia[] {
  const out: Estadia[] = [];
  const ocupa = [0.85, 0.7, 0.5, 0.45, 0.35, 0.4, 0.6, 0.5, 0.4, 0.45, 0.45, 0.8];
  let n = 0;
  PROPIEDADES.forEach((p, pi) => {
    const a = ANUNCIOS.find((x) => x.real === p.id)!;
    const rnd = mulberry32(5000 + pi * 17);
    let cur = "2025-01-02";
    const fin = "2026-10-25";
    while (cur < fin) {
      const m = Number(cur.slice(5, 7)) - 1;
      const occ = ocupa[m] * (0.85 + rnd() * 0.25);
      const hueco = Math.floor(rnd() * (1 + (1 - occ) * 9));
      const ini = addDays(cur, hueco);
      const len = Math.max(p.minNoches, 2 + Math.floor(rnd() * 5));
      const sal = addDays(ini, len);
      if (sal > fin) break;
      const temp = m === 11 || m === 0 ? 1.35 : m === 6 ? 1.12 : 1;
      let total = p.limpieza;
      for (const d of nightsOf(ini, sal)) {
        const wd = weekday(d);
        const base = wd === 5 || wd === 6 ? p.finde : p.base;
        total += Math.round((base * temp * (a.preciosInteligentes ? 0.94 + rnd() * 0.12 : 1)) / 5) * 5;
      }
      const [huesped, pais] = HUESPEDES[Math.floor(rnd() * HUESPEDES.length)];
      n++;
      out.push({ id: `H${String(n).padStart(4, "0")}`, prop: p.id, entrada: ini, noches: diffDays(ini, sal), huesped, pais, total });
      cur = sal;
    }
  });
  return out.sort((x, y) => (x.entrada < y.entrada ? -1 : 1));
}

export const HISTORIAL = generarHistorial();
