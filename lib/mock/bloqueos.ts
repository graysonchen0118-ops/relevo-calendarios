import type { Bloqueo } from "../types";

// Noches cerradas a mano en el calendario de Airbnb, sin una reserva de Airbnb detrás.
// Ninguna de estas viaja sola a Smoobu al conectar.
export const BLOQUEOS: Bloqueo[] = [
  { id: "B01", anuncio: "L01", inicio: "2026-12-30", fin: "2027-01-02", motivo: "WhatsApp", nota: "Familia Ortiz, cuatro personas. Anticipo pagado por transferencia.", estado: "solo-airbnb", choque: { huesped: "Martín Quiroga", pais: "Argentina", personas: 4 } },
  { id: "B02", anuncio: "L10", inicio: "2026-12-26", fin: "2027-01-02", motivo: "Huésped que repite", nota: "Los Herrera vuelven con los abuelos, como el año pasado.", estado: "solo-airbnb", choque: { huesped: "Emma Schultz", pais: "Alemania", personas: 7 } },
  { id: "B03", anuncio: "L03", inicio: "2026-12-22", fin: "2026-12-27", motivo: "Uso del dueño", nota: "Navidad de la familia del dueño.", estado: "solo-airbnb", choque: { huesped: "Diego Paredes", pais: "Perú", personas: 4 } },
  { id: "B04", anuncio: "L07", inicio: "2026-12-29", fin: "2027-01-03", motivo: "Teléfono", nota: "Matrimonio Vidal, llamaron por recomendación de un vecino.", estado: "solo-airbnb", choque: { huesped: "Olivia Brown", pais: "Estados Unidos", personas: 2 } },
  { id: "B05", anuncio: "L09", inicio: "2026-12-20", fin: "2026-12-24", motivo: "Mantenimiento", nota: "Pintura de la terraza y las barandas.", estado: "solo-airbnb", choque: { huesped: "Lukas Becker", pais: "Alemania", personas: 5 } },
  { id: "B06", anuncio: "L11", inicio: "2026-12-31", fin: "2027-01-04", motivo: "Reserva directa", nota: "Grupo de amigas, pagaron el total por transferencia.", estado: "solo-airbnb", choque: { huesped: "Camila Rojas", pais: "Chile", personas: 6 } },
  { id: "B07", anuncio: "L02", inicio: "2027-01-04", fin: "2027-01-08", motivo: "WhatsApp", nota: "Familia Soto, dos autos, piden cuna.", estado: "cargado" },
  { id: "B08", anuncio: "L05", inicio: "2026-12-24", fin: "2026-12-26", motivo: "Uso del dueño", nota: "Nochebuena del dueño con sus hijos.", estado: "solo-airbnb", choque: { huesped: "Joaquín Medina", pais: "Uruguay", personas: 5 } },
  { id: "B09", anuncio: "L12", inicio: "2026-12-28", fin: "2027-01-02", motivo: "Reserva directa", nota: "Pareja que reservó por Instagram, pagó el total.", estado: "solo-airbnb", choque: { huesped: "Noah Martin", pais: "Canadá", personas: 2 } },
  { id: "B10", anuncio: "L06", inicio: "2027-01-05", fin: "2027-01-09", motivo: "WhatsApp", nota: "Hermanas Ibáñez, segunda estadía.", estado: "cargado" },
  { id: "B11", anuncio: "L04", inicio: "2026-11-13", fin: "2026-11-16", motivo: "Mantenimiento", nota: "Cambio de colchón y cortinas.", estado: "solo-airbnb" },
  { id: "B12", anuncio: "L08", inicio: "2026-11-20", fin: "2026-11-23", motivo: "Uso del dueño", nota: "Fin de semana del dueño.", estado: "cargado" },
  { id: "B13", anuncio: "L01", inicio: "2026-11-06", fin: "2026-11-08", motivo: "Mantenimiento", nota: "Limpieza de chimenea antes del frío.", estado: "solo-airbnb" },
  { id: "B14", anuncio: "L10", inicio: "2027-02-12", fin: "2027-02-18", motivo: "Reserva directa", nota: "Familia Correa, reservaron en agosto.", estado: "solo-airbnb" },
  { id: "B15", anuncio: "L03", inicio: "2027-01-20", fin: "2027-01-27", motivo: "Huésped que repite", nota: "Tomás Aguirre, viene todos los años a pescar.", estado: "solo-airbnb" },
  { id: "B16", anuncio: "L11", inicio: "2027-02-27", fin: "2027-03-03", motivo: "WhatsApp", nota: "Cumpleaños de Paula, seis personas.", estado: "solo-airbnb" },
  { id: "B17", anuncio: "L05", inicio: "2026-11-27", fin: "2026-11-30", motivo: "Teléfono", nota: "Señor Fuentes, paga al llegar.", estado: "solo-airbnb" },
  { id: "B18", anuncio: "L12", inicio: "2026-11-10", fin: "2026-11-12", motivo: "Mantenimiento", nota: "Revisión del calentador de agua.", estado: "cargado" },
  { id: "B19", anuncio: "L02", inicio: "2027-02-05", fin: "2027-02-09", motivo: "Uso del dueño", nota: "Amigos del dueño, sin cargo.", estado: "solo-airbnb" },
  { id: "B20", anuncio: "L09", inicio: "2027-01-15", fin: "2027-01-22", motivo: "Reserva directa", nota: "Agencia de viajes, pago adelantado.", estado: "solo-airbnb" },
  { id: "B21", anuncio: "L06", inicio: "2026-12-05", fin: "2026-12-08", motivo: "Teléfono", nota: "Médica que viene por trabajo, factura a la clínica.", estado: "solo-airbnb" },
  { id: "B22", anuncio: "L07", inicio: "2027-03-12", fin: "2027-03-16", motivo: "Mantenimiento", nota: "Arreglo del aire acondicionado.", estado: "cargado" },
  { id: "B23", anuncio: "L08", inicio: "2027-01-02", fin: "2027-01-06", motivo: "WhatsApp", nota: "Familia Araya, piden llegar temprano.", estado: "solo-airbnb", choque: { huesped: "Pedro Alves", pais: "Brasil", personas: 6 } },
  { id: "B24", anuncio: "L04", inicio: "2027-01-01", fin: "2027-01-04", motivo: "Huésped que repite", nota: "Antonia y Bruno, festejan su aniversario.", estado: "solo-airbnb", choque: { huesped: "Marie Dubois", pais: "Francia", personas: 2 } },
];

export const MOTIVOS = ["WhatsApp", "Reserva directa", "Uso del dueño", "Mantenimiento", "Huésped que repite", "Teléfono"] as const;
