"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, CalendarRange, CheckCircle2, Clock3, Inbox, Lock, Pencil, Plus, Search, Signature, Sparkles, Star, Trash2, Upload, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { MOTIVOS } from "@/lib/mock/bloqueos";
import { FIESTAS_FIN, FIESTAS_INI } from "@/lib/mock/generar";
import { diffDays, fechaConDia, fechaCorta, mesLargo, noches, overlaps, plano, usd } from "@/lib/format";
import type { Bloqueo, Motivo, Reserva } from "@/lib/types";
import { Btn, FotoProp, Modal, Paginas, Panel, Skel, Tilt, Vacio } from "@/components/ui";

type Pestaña = "bloqueos" | "reservas" | "anuncios";

export default function Inventario() {
  const { db, ocupado, firmarInventario, cargarTodos } = useStore();
  const [tab, setTab] = useState<Pestaña>("bloqueos");
  const pend = db?.bloqueos.filter((b) => b.estado === "solo-airbnb").length ?? 0;

  return (
    <div className="pagina">
      <div className="pg-head">
        <div>
          <span className="eyebrow">
            <CalendarRange size={14} /> Paso 1 y paso 3
          </span>
          <h1>Inventario de Airbnb</h1>
          <p>Todo lo que hoy vive en la cuenta, antes de tocar nada. Las reservas cruzan solas a Smoobu. Las noches cerradas a mano no: hay que cargarlas una por una antes de conectar.</p>
        </div>
        {db && (
          <div className="pg-acc">
            {db.inventarioFirmado ? (
              <span className="sello">
                <CheckCircle2 size={17} /> Inventario firmado
              </span>
            ) : (
              <Btn className="btn-ghost" cargando={ocupado.inventario} onClick={firmarInventario}>
                {!ocupado.inventario && <Signature size={16} />} Firmar inventario
              </Btn>
            )}
          </div>
        )}
      </div>

      <div className="tabs" role="tablist">
        {(
          [
            ["bloqueos", "Bloqueos a mano", db ? `${pend} sin cargar` : ""],
            ["reservas", "Reservas de Airbnb", db ? String(db.reservas.length) : ""],
            ["anuncios", "Anuncios", "12"],
          ] as [Pestaña, string, string][]
        ).map(([k, t, n]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            {t} {n && <span className="tab-n">{n}</span>}
          </button>
        ))}
      </div>

      {!db ? (
        <div className="lista-skel">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skel key={i} h={84} r={16} />
          ))}
        </div>
      ) : tab === "bloqueos" ? (
        <Bloqueos pend={pend} cargarTodos={cargarTodos} cargandoTodos={!!ocupado.todos} />
      ) : tab === "reservas" ? (
        <Reservas />
      ) : (
        <Anuncios />
      )}
    </div>
  );
}

const enFiestas = (b: { inicio: string; fin: string }) => overlaps(b.inicio, b.fin, FIESTAS_INI, FIESTAS_FIN);

function Bloqueos({ pend, cargarTodos, cargandoTodos }: { pend: number; cargarTodos: () => Promise<void>; cargandoTodos: boolean }) {
  const { db, ocupado, cargarBloqueo, borrarBloqueo } = useStore();
  const [q, setQ] = useState("");
  const [prop, setProp] = useState("");
  const [motivo, setMotivo] = useState("");
  const [estado, setEstado] = useState("");
  const [orden, setOrden] = useState<"fecha" | "noches" | "prop">("fecha");
  const [form, setForm] = useState<Bloqueo | "nuevo" | null>(null);
  const [borrar, setBorrar] = useState<Bloqueo | null>(null);

  const lista = useMemo(() => {
    if (!db) return [];
    const nom = (b: Bloqueo) => db.props.find((p) => p.id === db.anuncios.find((a) => a.id === b.anuncio)?.real)?.nombre ?? "";
    let l = db.bloqueos.filter((b) => {
      if (prop && b.anuncio !== prop) return false;
      if (motivo && b.motivo !== motivo) return false;
      if (estado && b.estado !== estado) return false;
      if (q && !plano(`${b.nota} ${nom(b)} ${b.motivo}`).includes(plano(q))) return false;
      return true;
    });
    l = [...l].sort((x, y) => (orden === "fecha" ? (x.inicio < y.inicio ? -1 : 1) : orden === "noches" ? diffDays(y.inicio, y.fin) - diffDays(x.inicio, x.fin) : nom(x).localeCompare(nom(y))));
    return l;
  }, [db, q, prop, motivo, estado, orden]);

  if (!db) return null;
  const propDeAnuncio = (id: string) => db.props.find((p) => p.id === db.anuncios.find((a) => a.id === id)?.real);
  const nochesPend = db.bloqueos.filter((b) => b.estado === "solo-airbnb").reduce((s, b) => s + diffDays(b.inicio, b.fin), 0);

  return (
    <>
      <div className={`banda ${pend ? "banda-warn" : "banda-ok"}`}>
        {pend ? <Lock size={20} /> : <CheckCircle2 size={20} />}
        <p>
          {pend ? (
            <>
              <b>{noches(nochesPend)} cerradas a mano no existen para Smoobu.</b> Smoobu importa las reservas de Airbnb, pero no estos bloqueos. Si no están cargados antes de conectar, la primera sincronización publica esas noches como libres y Airbnb las vuelve a vender.
            </>
          ) : (
            <>
              <b>Todos los bloqueos están en Smoobu.</b> La primera sincronización va a salir con cada noche cerrada en su lugar.
            </>
          )}
        </p>
        {pend > 0 && (
          <Btn className="btn-primary" cargando={cargandoTodos} onClick={cargarTodos}>
            {!cargandoTodos && <Upload size={16} />} Cargar los {pend} pendientes
          </Btn>
        )}
      </div>

      <div className="toolbar">
        <label className="buscar">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nota, propiedad o motivo" aria-label="Buscar bloqueos" />
        </label>
        <select value={prop} onChange={(e) => setProp(e.target.value)} aria-label="Filtrar por propiedad">
          <option value="">Todas las propiedades</option>
          {db.anuncios.map((a) => (
            <option key={a.id} value={a.id}>
              {db.props.find((p) => p.id === a.real)?.nombre}
            </option>
          ))}
        </select>
        <select value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-label="Filtrar por motivo">
          <option value="">Todos los motivos</option>
          {MOTIVOS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="solo-airbnb">Solo en Airbnb</option>
          <option value="cargado">Cargado en Smoobu</option>
        </select>
        <label className="orden">
          <ArrowDownUp size={15} />
          <select value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} aria-label="Ordenar">
            <option value="fecha">Por fecha</option>
            <option value="noches">Por cantidad de noches</option>
            <option value="prop">Por propiedad</option>
          </select>
        </label>
        <button className="btn btn-dark" onClick={() => setForm("nuevo")}>
          <Plus size={16} /> Nuevo bloqueo
        </button>
      </div>

      {lista.length === 0 ? (
        <Vacio icono={<Inbox size={26} />} titulo="Ningún bloqueo con esos filtros" texto="Pruebe con otra propiedad o quite la búsqueda." accion={<button className="btn btn-ghost" onClick={() => { setQ(""); setProp(""); setMotivo(""); setEstado(""); }}>Quitar filtros</button>} />
      ) : (
        <div className="bloqueos">
          {lista.map((b, i) => {
            const p = propDeAnuncio(b.anuncio);
            const n = diffDays(b.inicio, b.fin);
            const busy = !!ocupado[b.id];
            return (
              <Tilt key={b.id} className={`bloq ${b.estado === "cargado" ? "cargado" : ""}`} fuerza={3} style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                <FotoProp p={p} w={92} h={70} className="bloq-foto" />
                <div className="bloq-cuerpo">
                  <div className="bloq-top">
                    <b>{p?.nombre}</b>
                    <span className={`badge m-${plano(b.motivo).replace(/ /g, "-")}`}>{b.motivo}</span>
                    {enFiestas(b) && (
                      <span className="badge b-fiestas">
                        <Sparkles size={12} /> Fiestas
                      </span>
                    )}
                  </div>
                  <div className="bloq-fechas">
                    {fechaConDia(b.inicio)} al {fechaConDia(b.fin)} · {noches(n)}
                  </div>
                  <p className="bloq-nota">{b.nota}</p>
                </div>
                <div className="bloq-der">
                  <span className={`estado ${b.estado === "cargado" ? "e-ok" : "e-warn"}`}>{b.estado === "cargado" ? "Cargado en Smoobu" : "Solo en Airbnb"}</span>
                  <div className="bloq-acc">
                    {b.estado === "solo-airbnb" && (
                      <Btn className="btn-primary btn-sm" cargando={busy} onClick={() => cargarBloqueo(b.id)}>
                        {!busy && <Upload size={14} />} Cargar
                      </Btn>
                    )}
                    <button className="icon-btn sm" onClick={() => setForm(b)} aria-label="Editar bloqueo">
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn sm" onClick={() => setBorrar(b)} aria-label="Eliminar bloqueo">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Tilt>
            );
          })}
        </div>
      )}

      {form && <FormBloqueo inicial={form === "nuevo" ? null : form} onCerrar={() => setForm(null)} />}
      <Modal
        abierto={!!borrar}
        titulo="Eliminar bloqueo"
        onCerrar={() => setBorrar(null)}
        pie={
          <>
            <button className="btn btn-ghost" onClick={() => setBorrar(null)}>
              Cancelar
            </button>
            <Btn
              className="btn-danger"
              cargando={borrar ? !!ocupado[borrar.id] : false}
              onClick={async () => {
                if (!borrar) return;
                await borrarBloqueo(borrar.id);
                setBorrar(null);
              }}
            >
              <Trash2 size={15} /> Eliminar
            </Btn>
          </>
        }
      >
        {borrar && (
          <p>
            Se quita del inventario el bloqueo de <b>{propDeAnuncio(borrar.anuncio)?.nombre}</b>, del {fechaCorta(borrar.inicio)} al {fechaCorta(borrar.fin)}. Úselo solo si esas noches ya no están comprometidas con nadie.
          </p>
        )}
      </Modal>
    </>
  );
}

function FormBloqueo({ inicial, onCerrar }: { inicial: Bloqueo | null; onCerrar: () => void }) {
  const { db, ocupado, guardarBloqueo } = useStore();
  const [anuncio, setAnuncio] = useState(inicial?.anuncio ?? "L01");
  const [inicio, setInicio] = useState(inicial?.inicio ?? "2027-01-10");
  const [fin, setFin] = useState(inicial?.fin ?? "2027-01-13");
  const [motivo, setMotivo] = useState<Motivo>(inicial?.motivo ?? "WhatsApp");
  const [nota, setNota] = useState(inicial?.nota ?? "");
  const [error, setError] = useState<string | null>(null);
  if (!db) return null;
  const guardar = async () => {
    if (!nota.trim()) {
      setError("Anote quién o qué ocupa esas noches, así se reconoce el bloqueo en Smoobu.");
      return;
    }
    const e = await guardarBloqueo({ id: inicial?.id, anuncio, inicio, fin, motivo, nota: nota.trim() });
    if (e) setError(e);
    else onCerrar();
  };
  return (
    <Modal
      abierto
      titulo={inicial ? "Editar bloqueo" : "Nuevo bloqueo a mano"}
      onCerrar={onCerrar}
      pie={
        <>
          <button className="btn btn-ghost" onClick={onCerrar}>
            Cancelar
          </button>
          <Btn className="btn-primary" cargando={!!ocupado.guardar} onClick={guardar}>
            Guardar
          </Btn>
        </>
      }
    >
      <div className="form">
        <label>
          Propiedad
          <select value={anuncio} onChange={(e) => setAnuncio(e.target.value)}>
            {db.anuncios.map((a) => (
              <option key={a.id} value={a.id}>
                {db.props.find((p) => p.id === a.real)?.nombre}
              </option>
            ))}
          </select>
        </label>
        <div className="form-2">
          <label>
            Entrada
            <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </label>
          <label>
            Salida
            <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
          </label>
        </div>
        <label>
          Motivo
          <select value={motivo} onChange={(e) => setMotivo(e.target.value as Motivo)}>
            {MOTIVOS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label>
          Nota
          <textarea rows={3} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Por ejemplo: Familia Ríos, reservó por WhatsApp, pagó anticipo" />
        </label>
        {inicio && fin && fin > inicio && <p className="muted small">{noches(diffDays(inicio, fin))}, del {fechaConDia(inicio)} al {fechaConDia(fin)}.</p>}
        {error && <p className="form-error">{error}</p>}
      </div>
    </Modal>
  );
}

const POR_PAGINA = 12;

function Reservas() {
  const { db } = useStore();
  const [q, setQ] = useState("");
  const [prop, setProp] = useState("");
  const [mes, setMes] = useState("");
  const [orden, setOrden] = useState<"entrada" | "total" | "noches">("entrada");
  const [pagina, setPagina] = useState(1);
  const [ver, setVer] = useState<Reserva | null>(null);

  const meses = useMemo(() => (db ? Array.from(new Set(db.reservas.map((r) => r.entrada.slice(0, 7)))).sort() : []), [db]);
  const lista = useMemo(() => {
    if (!db) return [];
    const l = db.reservas.filter((r) => {
      if (prop && r.anuncio !== prop) return false;
      if (mes && r.entrada.slice(0, 7) !== mes) return false;
      if (q && !plano(`${r.huesped} ${r.codigo} ${r.pais}`).includes(plano(q))) return false;
      return true;
    });
    return [...l].sort((x, y) => (orden === "entrada" ? (x.entrada < y.entrada ? -1 : 1) : orden === "total" ? y.total - x.total : diffDays(y.entrada, y.salida) - diffDays(x.entrada, x.salida)));
  }, [db, q, prop, mes, orden]);

  if (!db) return null;
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const pg = Math.min(pagina, paginas);
  const visibles = lista.slice((pg - 1) * POR_PAGINA, pg * POR_PAGINA);
  const nomProp = (anuncio: string) => db.props.find((p) => p.id === db.anuncios.find((a) => a.id === anuncio)?.real);

  return (
    <>
      <div className="banda banda-ok">
        <CheckCircle2 size={20} />
        <p>
          <b>Estas cruzan solas.</b> Al conectar, Smoobu importa las reservas actuales y futuras de Airbnb con nombre, fechas y cantidad de huéspedes. Lo anterior a hoy se queda en Airbnb, y para eso está el historial.
        </p>
      </div>
      <div className="toolbar">
        <label className="buscar">
          <Search size={16} />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPagina(1); }} placeholder="Buscar huésped, país o código" aria-label="Buscar reservas" />
        </label>
        <select value={prop} onChange={(e) => { setProp(e.target.value); setPagina(1); }} aria-label="Filtrar por propiedad">
          <option value="">Todas las propiedades</option>
          {db.anuncios.map((a) => (
            <option key={a.id} value={a.id}>
              {nomProp(a.id)?.nombre}
            </option>
          ))}
        </select>
        <select value={mes} onChange={(e) => { setMes(e.target.value); setPagina(1); }} aria-label="Filtrar por mes">
          <option value="">Todos los meses</option>
          {meses.map((m) => (
            <option key={m} value={m}>
              {mesLargo(m)}
            </option>
          ))}
        </select>
        <label className="orden">
          <ArrowDownUp size={15} />
          <select value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} aria-label="Ordenar">
            <option value="entrada">Por fecha de entrada</option>
            <option value="total">Por monto</option>
            <option value="noches">Por noches</option>
          </select>
        </label>
        <span className="muted small conteo">{lista.length} reservas</span>
      </div>
      {lista.length === 0 ? (
        <Vacio icono={<Inbox size={26} />} titulo="Sin reservas con esos filtros" texto="Cambie el mes o la propiedad." />
      ) : (
        <div className="tabla-wrap">
          <table className="tabla">
            <thead>
              <tr>
                <th>Huésped</th>
                <th>Propiedad</th>
                <th>Estadía</th>
                <th className="num">Personas</th>
                <th className="num">Total</th>
                <th>Código</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((r, i) => (
                <tr key={r.id} onClick={() => setVer(r)} style={{ animationDelay: `${i * 25}ms` }}>
                  <td>
                    <b>{r.huesped}</b>
                    <span className="muted small block">{r.pais}</span>
                  </td>
                  <td>{nomProp(r.anuncio)?.nombre}</td>
                  <td>
                    {fechaCorta(r.entrada)} al {fechaCorta(r.salida)}
                    <span className="muted small block">{noches(diffDays(r.entrada, r.salida))}</span>
                  </td>
                  <td className="num">{r.personas}</td>
                  <td className="num">{usd(r.total)}</td>
                  <td className="mono">{r.codigo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Paginas pagina={pg} total={paginas} onCambio={setPagina} />
      <Panel abierto={!!ver} onCerrar={() => setVer(null)} titulo={ver ? <><b>{ver.huesped}</b><span className="muted small block">Reserva {ver.codigo}</span></> : ""}>
        {ver && (
          <div className="detalle">
            <FotoProp p={nomProp(ver.anuncio)} w={380} h={220} className="detalle-foto" />
            <dl>
              <dt>Propiedad</dt>
              <dd>{nomProp(ver.anuncio)?.nombre}</dd>
              <dt>Entrada</dt>
              <dd>{fechaConDia(ver.entrada)}</dd>
              <dt>Salida</dt>
              <dd>{fechaConDia(ver.salida)}</dd>
              <dt>Noches</dt>
              <dd>{diffDays(ver.entrada, ver.salida)}</dd>
              <dt>Personas</dt>
              <dd>
                <Users size={14} /> {ver.personas}
              </dd>
              <dt>País</dt>
              <dd>{ver.pais}</dd>
              <dt>Total con limpieza</dt>
              <dd>{usd(ver.total)}</dd>
              <dt>Reservada el</dt>
              <dd>{fechaConDia(ver.creada)}</dd>
            </dl>
            <p className="muted small">
              <Clock3 size={13} /> Entra a Smoobu con la conexión, en la fila de la propiedad con la que esté emparejado su anuncio.
            </p>
          </div>
        )}
      </Panel>
    </>
  );
}

function Anuncios() {
  const { db } = useStore();
  if (!db) return null;
  return (
    <div className="grid g-anuncios">
      {db.anuncios.map((a, i) => {
        const p = db.props.find((x) => x.id === a.real);
        const e = db.emparejado[a.id];
        return (
          <Tilt key={a.id} className="anuncio" fuerza={6} style={{ animationDelay: `${i * 40}ms` }}>
            <FotoProp p={p} w={340} h={200} className="anuncio-foto" />
            <div className="anuncio-cuerpo">
              <span className="muted small mono">Anuncio {a.airbnbId}</span>
              <b>{a.titulo}</b>
              <div className="anuncio-meta">
                <span>
                  <Star size={13} /> {a.nota.toFixed(2).replace(".", ",")} · {a.resenas} reseñas
                </span>
                <span className={`badge ${a.preciosInteligentes ? "b-clay" : "b-neutro"}`}>{a.preciosInteligentes ? "Precios Inteligentes activos" : "Precios a mano"}</span>
              </div>
              <span className={`estado ${e.check === "ok" ? "e-ok" : e.check === "error" ? "e-err" : "e-warn"}`}>{!e.prop ? "Sin emparejar" : e.check === "ok" ? "Emparejado y comprobado" : e.check === "error" ? "Emparejado cruzado" : "Emparejado sin comprobar"}</span>
            </div>
          </Tilt>
        );
      })}
    </div>
  );
}
