"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Inbox, Link2, ScanSearch, TriangleAlert, Wand2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { diffDays, fechaCorta, noches } from "@/lib/format";
import { Barra, Btn, FotoProp, Skel, Tilt, Vacio } from "@/components/ui";

type Filtro = "todos" | "libres" | "pendientes" | "cruzados" | "ok";

export default function Emparejado() {
  const { db, ocupado, emparejar, comprobar, comprobarTodos } = useStore();
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const filas = useMemo(() => {
    if (!db) return [];
    return db.anuncios
      .map((a) => {
        const e = db.emparejado[a.id];
        const testigo = db.reservas.find((r) => r.anuncio === a.id);
        return { a, e, testigo };
      })
      .filter(({ e }) => {
        if (filtro === "libres") return !e.prop;
        if (filtro === "pendientes") return !!e.prop && e.check === "pendiente";
        if (filtro === "cruzados") return e.check === "error";
        if (filtro === "ok") return e.check === "ok";
        return true;
      });
  }, [db, filtro]);

  const cuenta = useMemo(() => {
    if (!db) return { ok: 0, libres: 0, pend: 0, cruz: 0 };
    const v = Object.values(db.emparejado);
    return { ok: v.filter((e) => e.check === "ok").length, libres: v.filter((e) => !e.prop).length, pend: v.filter((e) => e.prop && e.check === "pendiente").length, cruz: v.filter((e) => e.check === "error").length };
  }, [db]);

  return (
    <div className="pagina">
      <div className="pg-head">
        <div>
          <span className="eyebrow">
            <Link2 size={14} /> Paso 2
          </span>
          <h1>Emparejado de anuncios</h1>
          <p>Cada anuncio de Airbnb se apunta a mano a una propiedad de Smoobu, y los nombres no tienen que coincidir. Dos departamentos casi iguales se cruzan sin que nadie lo note, hasta que la limpieza va a preparar el que no era. Por eso cada par se comprueba con una reserva testigo.</p>
        </div>
        {db && (
          <div className="pg-acc">
            <Btn className="btn-primary" cargando={!!ocupado["chk-todos"]} onClick={comprobarTodos}>
              {!ocupado["chk-todos"] && <ScanSearch size={16} />} Comprobar todos
            </Btn>
          </div>
        )}
      </div>

      {!db ? (
        <div className="lista-skel">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skel key={i} h={150} r={18} />
          ))}
        </div>
      ) : (
        <>
          <div className="progreso-card">
            <div>
              <b>
                {cuenta.ok} de {db.anuncios.length}
              </b>{" "}
              anuncios caen en su fila
            </div>
            <Barra valor={cuenta.ok} max={db.anuncios.length} tono={cuenta.cruz ? "err" : "ok"} />
            <div className="chips">
              {(
                [
                  ["todos", "Todos", db.anuncios.length],
                  ["libres", "Sin emparejar", cuenta.libres],
                  ["pendientes", "Sin comprobar", cuenta.pend],
                  ["cruzados", "Cruzados", cuenta.cruz],
                  ["ok", "Comprobados", cuenta.ok],
                ] as [Filtro, string, number][]
              ).map(([k, t, n]) => (
                <button key={k} className={`chip-btn ${filtro === k ? "on" : ""} ${k === "cruzados" && n ? "alerta" : ""}`} onClick={() => setFiltro(k)}>
                  {t} <span>{n}</span>
                </button>
              ))}
            </div>
          </div>

          {filas.length === 0 ? (
            <Vacio icono={<Inbox size={26} />} titulo="Nada en este filtro" texto="Pruebe con Todos para ver los doce anuncios." accion={<button className="btn btn-ghost" onClick={() => setFiltro("todos")}>Ver todos</button>} />
          ) : (
            <div className="pares">
              {filas.map(({ a, e, testigo }, i) => {
                const real = db.props.find((p) => p.id === a.real);
                const elegida = db.props.find((p) => p.id === e.prop);
                const busy = !!ocupado[`chk-${a.id}`];
                return (
                  <div key={a.id} className={`par par-${!e.prop ? "libre" : e.check}`} style={{ animationDelay: `${i * 50}ms` }}>
                    <Tilt className="par-lado" fuerza={5}>
                      <FotoProp p={real} w={120} h={88} className="par-foto" />
                      <div>
                        <span className="lado-rot">En Airbnb</span>
                        <b className="par-titulo">{a.titulo}</b>
                        <span className="muted small mono">Anuncio {a.airbnbId}</span>
                      </div>
                    </Tilt>
                    <div className="par-flecha" aria-hidden="true">
                      {e.check === "ok" ? <CheckCircle2 size={22} /> : e.check === "error" ? <TriangleAlert size={22} /> : <ArrowRight size={22} />}
                    </div>
                    <Tilt className="par-lado" fuerza={5}>
                      <FotoProp p={elegida} w={120} h={88} className="par-foto" />
                      <div className="par-sel">
                        <span className="lado-rot">En Smoobu</span>
                        <select value={e.prop ?? ""} onChange={(ev) => emparejar(a.id, ev.target.value || null)} aria-label={`Propiedad de Smoobu para ${a.titulo}`}>
                          <option value="">Elegir</option>
                          {db.props.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre}
                            </option>
                          ))}
                        </select>
                        <span className="muted small">{elegida ? `${elegida.tipo} · ${elegida.huespedes} huéspedes · ${elegida.zona}` : "Todavía sin propiedad"}</span>
                      </div>
                    </Tilt>
                    <div className="par-pie">
                      {testigo ? (
                        <span className="testigo">
                          Reserva testigo: <b>{testigo.huesped}</b>, {fechaCorta(testigo.entrada)} al {fechaCorta(testigo.salida)}, {noches(diffDays(testigo.entrada, testigo.salida))}
                        </span>
                      ) : (
                        <span className="muted small">Sin reservas futuras para usar de testigo.</span>
                      )}
                      {e.check === "ok" && <span className="resultado r-ok">Cae en su fila</span>}
                      {e.check === "error" && elegida && (
                        <span className="resultado r-err">
                          La reserva es de {real?.nombre} y caería en {elegida.nombre}
                        </span>
                      )}
                      <div className="par-acc">
                        {e.check === "error" && (
                          <button className="btn btn-ghost btn-sm" onClick={() => emparejar(a.id, a.real)}>
                            <Wand2 size={14} /> Usar {real?.nombre}
                          </button>
                        )}
                        {e.check !== "ok" && (
                          <Btn className="btn-dark btn-sm" cargando={busy} onClick={() => comprobar(a.id)}>
                            {!busy && <ScanSearch size={14} />} Comprobar
                          </Btn>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
