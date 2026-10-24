import type { Anuncio, Emparejado, Propiedad } from "../types";

export const PROPIEDADES: Propiedad[] = [
  { id: "P01", nombre: "Cabaña del Bosque", tipo: "Cabaña", zona: "Bosque", huespedes: 4, dormitorios: 2, foto: "troncos", base: 110, finde: 135, limpieza: 30, minNoches: 2 },
  { id: "P02", nombre: "Chalet Los Pinos", tipo: "Casa", zona: "Bosque", huespedes: 6, dormitorios: 3, foto: "chalet", base: 150, finde: 180, limpieza: 40, minNoches: 2 },
  { id: "P03", nombre: "Refugio del Lago", tipo: "Cabaña", zona: "Lago", huespedes: 4, dormitorios: 2, foto: "lago", base: 130, finde: 160, limpieza: 35, minNoches: 3 },
  { id: "P04", nombre: "Cabaña Triángulo", tipo: "Cabaña", zona: "Bosque", huespedes: 2, dormitorios: 1, foto: "triangulo", base: 95, finde: 120, limpieza: 25, minNoches: 2 },
  { id: "P05", nombre: "Casa Leña", tipo: "Cabaña", zona: "Valle", huespedes: 5, dormitorios: 2, foto: "lena", base: 120, finde: 145, limpieza: 30, minNoches: 2 },
  { id: "P06", nombre: "Vista Mar 2A", tipo: "Departamento", zona: "Frente al mar", huespedes: 3, dormitorios: 1, foto: "balcon", base: 85, finde: 105, limpieza: 25, minNoches: 2 },
  { id: "P07", nombre: "Vista Mar 2B", tipo: "Departamento", zona: "Frente al mar", huespedes: 3, dormitorios: 1, foto: "dormitorioMar", base: 85, finde: 105, limpieza: 25, minNoches: 2 },
  { id: "P08", nombre: "Gemela Norte", tipo: "Casa", zona: "Playa", huespedes: 6, dormitorios: 3, foto: "gemelas", fx: 0.27, base: 190, finde: 230, limpieza: 45, minNoches: 3 },
  { id: "P09", nombre: "Gemela Sur", tipo: "Casa", zona: "Playa", huespedes: 6, dormitorios: 3, foto: "gemelas", fx: 0.73, base: 190, finde: 230, limpieza: 45, minNoches: 3 },
  { id: "P10", nombre: "Casa Duna", tipo: "Casa", zona: "Playa", huespedes: 8, dormitorios: 4, foto: "dunas", base: 240, finde: 290, limpieza: 55, minNoches: 3 },
  { id: "P11", nombre: "Casa Celeste", tipo: "Casa", zona: "Bahía", huespedes: 6, dormitorios: 3, foto: "celeste", base: 175, finde: 210, limpieza: 45, minNoches: 2 },
  { id: "P12", nombre: "Loft Ladrillo", tipo: "Loft", zona: "Centro", huespedes: 2, dormitorios: 1, foto: "ladrillo", base: 75, finde: 90, limpieza: 20, minNoches: 1 },
];

export const ANUNCIOS: Anuncio[] = [
  { id: "L01", airbnbId: "48213907", titulo: "Cabaña de troncos entre pinos, chimenea y silencio", real: "P01", preciosInteligentes: false, resenas: 212, nota: 4.92 },
  { id: "L02", airbnbId: "51870344", titulo: "Chalet con deck para seis, ideal familias", real: "P02", preciosInteligentes: true, resenas: 148, nota: 4.88 },
  { id: "L03", airbnbId: "39025518", titulo: "Refugio sobre el lago con muelle propio", real: "P03", preciosInteligentes: false, resenas: 301, nota: 4.95 },
  { id: "L04", airbnbId: "60417722", titulo: "Cabaña A para dos, ventanal al bosque", real: "P04", preciosInteligentes: true, resenas: 96, nota: 4.97 },
  { id: "L05", airbnbId: "44781260", titulo: "Casa de leña en el valle, fogón y huerta", real: "P05", preciosInteligentes: false, resenas: 133, nota: 4.81 },
  { id: "L06", airbnbId: "57302195", titulo: "Departamento con balcón al mar, piso 2, unidad A", real: "P06", preciosInteligentes: true, resenas: 187, nota: 4.86 },
  { id: "L07", airbnbId: "57302871", titulo: "Departamento luminoso con vista al mar, piso 2, unidad B", real: "P07", preciosInteligentes: true, resenas: 164, nota: 4.84 },
  { id: "L08", airbnbId: "62950413", titulo: "Casa de playa gemela, lado norte, escalera a la arena", real: "P08", preciosInteligentes: false, resenas: 72, nota: 4.9 },
  { id: "L09", airbnbId: "62951087", titulo: "Casa de playa gemela, lado sur, escalera a la arena", real: "P09", preciosInteligentes: false, resenas: 68, nota: 4.89 },
  { id: "L10", airbnbId: "35518842", titulo: "Casa frente a las dunas para ocho, atardeceres", real: "P10", preciosInteligentes: true, resenas: 254, nota: 4.93 },
  { id: "L11", airbnbId: "47129630", titulo: "Casa celeste en la bahía con galería", real: "P11", preciosInteligentes: false, resenas: 119, nota: 4.87 },
  { id: "L12", airbnbId: "66804519", titulo: "Loft de ladrillo en el centro, a pasos de todo", real: "P12", preciosInteligentes: true, resenas: 403, nota: 4.79 },
];

/** cómo arranca el emparejado: casi todo hecho, los dos deptos del piso 2 cruzados y tres sin elegir */
export const EMPAREJADO_INICIAL: Record<string, Emparejado> = {
  L01: { prop: "P01", check: "ok" },
  L02: { prop: "P02", check: "ok" },
  L03: { prop: "P03", check: "pendiente" },
  L04: { prop: "P04", check: "ok" },
  L05: { prop: null, check: "pendiente" },
  L06: { prop: "P07", check: "pendiente" },
  L07: { prop: "P06", check: "pendiente" },
  L08: { prop: "P08", check: "pendiente" },
  L09: { prop: null, check: "pendiente" },
  L10: { prop: "P10", check: "ok" },
  L11: { prop: "P11", check: "pendiente" },
  L12: { prop: null, check: "pendiente" },
};

export const propDe = (id: string | null | undefined) => PROPIEDADES.find((p) => p.id === id);
export const anuncioDe = (id: string) => ANUNCIOS.find((a) => a.id === id)!;
