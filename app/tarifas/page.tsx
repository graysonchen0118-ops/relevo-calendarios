"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, CalendarDays, CheckCheck, Download, Sparkles, Tags, TriangleAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { fechaConDia, miles, usd, weekday } from "@/lib/format";
import type { Noche } from "@/lib/types";
import { altasLibres } from "@/lib/sim";
import { nightsOf } from "@/lib/format";
import { Barra, Btn, FotoProp, Modal, Skel, Tilt } from "@/components/ui";

const DIA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export default function Tarifas() {
  const { db, ocupado, importarTarifas, revisarAltas, fijarPrecio } = useStore();
  const [sel, setSel] = useState("P02");
  const [soloAltas, setSoloAltas] = useState(false);
  const [editar, setEditar] = useState<Noche | null>(null);
  const [valor, setValor] = useState("");

  const resumen = useMemo(() => {
    if (!db) return [];
    return db.props.map((p) => {
      const t = db.tarifas[p.id];
      const libres = altasLibres(db, p.id);
      const ok = libres.filter((n) => n.smoobu !== null && n.revisada).length;
      const enJuego = libres.filter((n) => n.smoobu === null).reduce((s, n) => s + (n.airbnb - p.base), 0);
      const a = db.anuncios.find((x) => x.real === p.id)!;
      const vendidas = new Set<string>();
      const bloqueadas = new Set<string>();
      db.reservas.forEach((r) => r.anuncio === a.id && nightsOf(r.entrada, r.salida).forEach((d) => vendidas.add(d)));
      db.bloqueos.forEach((b) => b.anuncio === a.id && nightsOf(b.inicio, b.fin).forEach((d) => bloqueadas.add(d)));
      return { p, t, total: libres.length, ok, enJuego, vendidas, bloqueadas };
    });
  }, [db]);

  if (!db) {
    return (
      <div className="pagina">
        <div className="pg-head">
          <div>
            <h1>Tarifas de las fiestas</h1>
          </div>
        </div>
        <div className="grid g-tarifas">
          <Skel h={520} r={18} />
          <Skel h={520} r={18} />
        </div>
      </div>
    );
  }

  const actual = resumen.find((x) => x.p.id === sel) ?? resumen[0];
  const { p, t } = actual;
  const anuncio = db.anuncios.find((a) => a.real === p.id)!;
  const noches = soloAltas ? t.noches.filter((n) => n.alta) : t.noches;
  const totalEnJuego = resumen.reduce((s, x) => s + x.enJuego, 0);
  const primerDia = weekday(noches[0]?.fecha ?? "2026-12-15");
  const huecos = soloAltas ? 0 : (primerDia + 6) % 7;

  return (
    <div className="pagina">
      <div className="pg-head">
        <div>
          <span className="eyebrow">
            <Tags size={14} /> Paso 3, tarifas
          </span>
          <h1>Tarifas de las fiestas</h1>
          <p>Desde que se conecta, Airbnb deja de aceptar cambios de precio y apaga los Precios Inteligentes: cada noche pasa a valer lo que diga Smoobu. Las noches altas se traen y se revisan antes de publicar, para que Año Nuevo no salga a precio de un martes cualquiera.</p>
        </div>
        <div className="pg-acc">
          <div className={`en-juego ${totalEnJuego ? "" : "cero"}`}>
            <span>Diferencia en juego</span>
            <b>{usd(totalEnJuego)}</b>
            <small>{totalEnJuego ? "noches altas que hoy saldrían a precio base" : "ninguna noche alta sale a precio base"}</small>
          </div>
        </div>
      </div>

      <div className="grid g-tarifas">
        <aside className="props-col">
          <select className="props-select" value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Elegir propiedad">
            {resumen.map(({ p: x, ok, total }) => (
              <option key={x.id} value={x.id}>
                {x.nombre} · {ok}/{total} revisadas
              </option>
            ))}
          </select>
          <ul className="props-lista">
            {resumen.map(({ p: x, t: tx, ok, total, enJuego }) => (
              <li key={x.id}>
                <button className={`prop-item ${x.id === sel ? "on" : ""}`} onClick={() => setSel(x.id)}>
                  <FotoProp p={x} w={52} h={40} className="mini" />
                  <span className="prop-item-txt">
                    <b>{x.nombre}</b>
                    <span className="muted small">{!tx.importada ? "Sin traer de Airbnb" : ok === total ? "Altas revisadas" : `${ok} de ${total} altas revisadas`}</span>
                  </span>
                  <i className={`punto ${ok === total ? "p-ok" : enJuego ? "p-err" : "p-warn"}`} />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="card tarifa">
          <div className="tarifa-head">
            <Tilt className="tarifa-foto" fuerza={8}>
              <FotoProp p={p} w={200} h={140} />
            </Tilt>
            <div className="tarifa-datos">
              <h2>{p.nombre}</h2>
              <div className="datos">
                <span>
                  Base <b>{usd(p.base)}</b>
                </span>
                <span>
                  Viernes y sábado <b>{usd(p.finde)}</b>
                </span>
                <span>
                  Limpieza <b>{usd(p.limpieza)}</b>
                </span>
                <span>
                  Mínimo <b>{p.minNoches} noches</b>
                </span>
              </div>
              {anuncio.preciosInteligentes && (
                <p className="nota-clay">
                  <Sparkles size={15} /> Hoy usa Precios Inteligentes. Al conectar se apagan solos y el precio deja de moverse con la demanda.
                </p>
              )}
              <div className="tarifa-acc">
                {!t.importada ? (
                  <Btn className="btn-primary" cargando={!!ocupado[`imp-${p.id}`]} onClick={() => importarTarifas(p.id)}>
                    {!ocupado[`imp-${p.id}`] && <Download size={16} />} Traer tarifas de Airbnb
                  </Btn>
                ) : actual.ok < actual.total ? (
                  <Btn className="btn-primary" cargando={!!ocupado[`rev-${p.id}`]} onClick={() => revisarAltas(p.id)}>
                    {!ocupado[`rev-${p.id}`] && <CheckCheck size={16} />} Dar por revisadas las {actual.total - actual.ok} altas
                  </Btn>
                ) : (
                  <span className="sello">
                    <BadgeCheck size={17} /> Fiestas revisadas
                  </span>
                )}
                <label className="check">
                  <input type="checkbox" checked={soloAltas} onChange={(e) => setSoloAltas(e.target.checked)} />
                  Solo noches altas
                </label>
              </div>
            </div>
          </div>
          <div className="tarifa-prog">
            <Barra valor={actual.ok} max={actual.total} tono={actual.ok === actual.total ? "ok" : "clay"} />
            <span className="muted small">
              {actual.ok} de {actual.total} noches altas todavía a la venta revisadas, del 22 dic al 4 ene
            </span>
          </div>

          {!soloAltas && (
            <div className="cal-dias" aria-hidden="true">
              {["lun", "mar", "mié", "jue", "vie", "sáb", "dom"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          )}
          <div className={`cal ${soloAltas ? "cal-lista" : ""}`}>
            {Array.from({ length: huecos }).map((_, i) => (
              <span key={`h${i}`} className="cal-hueco" />
            ))}
            {noches.map((n, i) => {
              const base = weekday(n.fecha) === 5 || weekday(n.fecha) === 6 ? p.finde : p.base;
              const vendida = actual.vendidas.has(n.fecha);
              const bloqueada = actual.bloqueadas.has(n.fecha);
              const riesgo = !vendida && !bloqueada && n.alta && n.smoobu === null;
              const estado = vendida || bloqueada ? "vendida" : riesgo ? "riesgo" : n.alta && !n.revisada ? "revisar" : n.alta ? "ok" : "normal";
              return (
                <button
                  key={n.fecha}
                  disabled={estado === "vendida"}
                  className={`cal-celda c-${estado}`}
                  style={{ animationDelay: `${i * 14}ms` }}
                  onClick={() => {
                    setEditar(n);
                    setValor(String(n.smoobu ?? n.airbnb));
                  }}
                  aria-label={`${fechaConDia(n.fecha)}, Airbnb ${n.airbnb}, Smoobu ${n.smoobu ?? "sin precio"}`}
                >
                  <span className="cal-fecha">
                    {soloAltas && <em>{DIA[weekday(n.fecha)]} </em>}
                    {Number(n.fecha.slice(8))} {n.fecha.slice(5, 7) === "12" ? "dic" : "ene"}
                  </span>
                  {n.etiqueta && <span className="cal-etq">{n.etiqueta}</span>}
                  <span className="cal-airbnb">Airbnb {miles(n.airbnb)}</span>
                  <span className="cal-smoobu">{vendida ? "Ya vendida" : bloqueada ? "Bloqueada" : n.smoobu === null ? `Saldría a ${miles(base)}` : `Smoobu ${miles(n.smoobu)}`}</span>
                  {estado === "riesgo" && <TriangleAlert size={13} className="cal-ic" />}
                  {estado === "ok" && <BadgeCheck size={13} className="cal-ic" />}
                </button>
              );
            })}
          </div>
          <p className="muted small leyenda-cal">
            <CalendarDays size={13} /> Toque una noche para fijar su precio en Smoobu. Rojo: alta que saldría a precio base. Ámbar: traída pero sin revisar. Verde: revisada. Gris: ya vendida o bloqueada, su precio no cambia nada.
          </p>
        </section>
      </div>

      <Modal
        abierto={!!editar}
        titulo={editar ? `${p.nombre}, ${fechaConDia(editar.fecha)}` : ""}
        onCerrar={() => setEditar(null)}
        pie={
          <>
            <button className="btn btn-ghost" onClick={() => setEditar(null)}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              disabled={!(Number(valor) > 0)}
              onClick={() => {
                if (!editar) return;
                fijarPrecio(p.id, editar.fecha, Math.round(Number(valor)));
                setEditar(null);
              }}
            >
              <BadgeCheck size={16} /> Guardar y marcar revisada
            </button>
          </>
        }
      >
        {editar && (
          <div className="form">
            <div className="comparar">
              <div>
                <span className="muted small">Hoy en Airbnb</span>
                <b>{usd(editar.airbnb)}</b>
              </div>
              <div>
                <span className="muted small">En Smoobu</span>
                <b>{editar.smoobu === null ? "Sin precio" : usd(editar.smoobu)}</b>
              </div>
              <div>
                <span className="muted small">Precio base</span>
                <b>{usd(p.base)}</b>
              </div>
            </div>
            {editar.etiqueta && (
              <p className="nota-clay">
                <Sparkles size={15} /> {editar.etiqueta}: una de las noches que más vale del año.
              </p>
            )}
            <label>
              Precio para esta noche en Smoobu (USD)
              <input type="number" min={1} inputMode="numeric" value={valor} onChange={(e) => setValor(e.target.value)} />
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
