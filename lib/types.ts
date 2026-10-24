export type Tipo = "Cabaña" | "Casa" | "Departamento" | "Loft";

/** propiedad tal como se crea en Smoobu */
export interface Propiedad {
  id: string;
  nombre: string;
  tipo: Tipo;
  zona: string;
  huespedes: number;
  dormitorios: number;
  foto: string;
  fx?: number;
  base: number;
  finde: number;
  limpieza: number;
  minNoches: number;
}

/** anuncio tal como existe hoy en Airbnb */
export interface Anuncio {
  id: string;
  airbnbId: string;
  titulo: string;
  /** a qué propiedad corresponde de verdad (lo que la comprobación con reserva testigo confirma) */
  real: string;
  preciosInteligentes: boolean;
  resenas: number;
  nota: number;
}

export type Comprobacion = "pendiente" | "ok" | "error";

export interface Emparejado {
  prop: string | null;
  check: Comprobacion;
}

export interface Reserva {
  id: string;
  codigo: string;
  anuncio: string;
  huesped: string;
  pais: string;
  personas: number;
  entrada: string;
  salida: string;
  total: number;
  creada: string;
  /** reserva nueva que entró sobre una noche que estaba bloqueada a mano */
  choqueCon?: string;
}

export type Motivo = "WhatsApp" | "Reserva directa" | "Uso del dueño" | "Mantenimiento" | "Huésped que repite" | "Teléfono";

export interface Bloqueo {
  id: string;
  anuncio: string;
  inicio: string;
  fin: string;
  motivo: Motivo;
  nota: string;
  estado: "solo-airbnb" | "cargado";
  /** quién reservaría esas noches por Airbnb si volvieran a la venta en las fiestas */
  choque?: { huesped: string; pais: string; personas: number };
}

export interface Noche {
  fecha: string;
  airbnb: number;
  smoobu: number | null;
  alta: boolean;
  etiqueta?: string;
  revisada: boolean;
}

export interface Tarifa {
  prop: string;
  importada: boolean;
  noches: Noche[];
}

export interface Estadia {
  id: string;
  prop: string;
  entrada: string;
  noches: number;
  huesped: string;
  pais: string;
  total: number;
}

export interface Actividad {
  id: string;
  hora: string;
  texto: string;
  tono: "ok" | "warn" | "err" | "info";
}

export type EstadoFila = "ok" | "otra-fila" | "sin-importar" | "reabierta" | "choque";

export interface FilaCuadre {
  id: string;
  tipo: "reserva" | "bloqueo" | "choque";
  anuncio: string;
  prop: string;
  titulo: string;
  detalle: string;
  inicio: string;
  fin: string;
  estado: EstadoFila;
  resuelta?: string;
}

export interface Conexion {
  estado: "sin-conectar" | "conectando" | "conectada";
  paso: number;
  fecha?: string;
  foto?: { mapa: Record<string, string | null>; cargados: string[] };
}

export interface Toast {
  id: number;
  tono: "ok" | "err" | "info";
  texto: string;
}

export interface DB {
  props: Propiedad[];
  anuncios: Anuncio[];
  emparejado: Record<string, Emparejado>;
  reservas: Reserva[];
  bloqueos: Bloqueo[];
  tarifas: Record<string, Tarifa>;
  inventarioFirmado: boolean;
  conexion: Conexion;
  choques: Reserva[];
  resueltas: Record<string, string>;
  actividad: Actividad[];
}
