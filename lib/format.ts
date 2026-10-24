// Fechas como texto ISO (AAAA-MM-DD) y aritmética en UTC, así el servidor y el navegador
// muestran exactamente lo mismo y no hay diferencias al hidratar.

export const mulberry32 = (seed: number) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const ms = (iso: string) => Date.parse(iso + "T00:00:00Z");

export const addDays = (iso: string, n: number) => {
  const d = new Date(ms(iso));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const diffDays = (a: string, b: string) => Math.round((ms(b) - ms(a)) / 86400000);

export const weekday = (iso: string) => new Date(ms(iso)).getUTCDay();

/** noches [a, b) y [c, d) se pisan */
export const overlaps = (a: string, b: string, c: string, d: string) => a < d && c < b;

export const nightsOf = (start: string, end: string) => {
  const out: string[] = [];
  for (let d = start; d < end; d = addDays(d, 1)) out.push(d);
  return out;
};

const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MES_L = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export const fechaCorta = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MES[m - 1]}`;
};

export const fechaConDia = (iso: string) => `${DIA[weekday(iso)]} ${fechaCorta(iso)}`;

export const fechaLarga = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} de ${MES_L[m - 1]} de ${y}`;
};

export const mesCorto = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MES[m - 1]} ${String(y).slice(2)}`;
};

export const mesLargo = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MES_L[m - 1]} ${y}`;
};

export const rango = (a: string, b: string) => `${fechaCorta(a)} al ${fechaCorta(b)}`;

export const noches = (n: number) => (n === 1 ? "1 noche" : `${n} noches`);

export const miles = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const usd = (n: number) => `USD ${miles(n)}`;

export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export const sleep = (t: number) => new Promise<void>((r) => setTimeout(r, t));

export const hora = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** sin acentos y en minúsculas, para buscar */
export const plano = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
