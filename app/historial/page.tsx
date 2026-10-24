"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, BedDouble, CalendarDays, Download, FileSpreadsheet, History, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import { HISTORIAL } from "@/lib/mock/generar";
import { mesCorto, mesLargo, miles, sleep, usd } from "@/lib/format";
import { Btn, FotoProp, Kpi, Skel, Tilt } from "@/components/ui";

type Metrica = "noches" | "ingresos";
type Orden = "ingresos" | "noches" | "estadias" | "nombre";

export default function Historial() {
  const { db } = useStore();
  const [prop, setProp] = useState("");
  const [anio, setAnio] = useState("");
  const [metrica, setMetrica] = useState<Metrica>("ingresos");
  const [orden, setOrden] = useState<Orden>("ingresos");
  const [bajando, setBajando] = useState(false);

  const estadias = useMemo(() => HISTORIAL.filter((e) => (!prop || e.prop === prop) && (!anio || e.entrada.startsWith(anio))), [prop, anio]);

  const meses = useMemo(() => {
    const m = new Map<string, { noches: number; ingresos: number }>();
    for (let y = 2025; y <= 2026; y++)
      for (let i = 1; i <= 12; i++) {
        const k = `${y}-${String(i).padStart(2, "0")}`;
        if (k > "2026-10") continue;
        if (anio && !k.startsWith(anio)) continue;
        m.set(k, { noches: 0, ingresos: 0 });
      }
    estadias.forEach((e) => {
      const v = m.get(e.entrada.slice(0, 7));
      if (!v) return;
      v.noches += e.noches;
      v.ingresos += e.total;
    });
    return Array.from(m.entries());
  }, [estadias, anio]);

  const porProp = useMemo(() => {
    if (!db) return [];
    const rows = db.props.map((p) => {
      const es = HISTORIAL.filter((e) => e.prop === p.id && (!anio || e.entrada.startsWith(anio)));
      const porMes = new Map<string, number>();
      es.forEach((e) => porMes.set(e.entrada.slice(0, 7), (porMes.get(e.entrada.slice(0, 7)) ?? 0) + e.total));
      const mejor = Array.from(porMes.entries()).sort((a, b) => b[1] - a[1])[0];
      return { p, estadias: es.length, noches: es.reduce((s, e) => s + e.noches, 0), ingresos: es.reduce((s, e) => s + e.total, 0), mejor: mejor?.[0] };
    });
    return rows.sort((a, b) => (orden === "nombre" ? a.p.nombre.localeCompare(b.p.nombre) : b[orden] - a[orden]));
  }, [db, anio, orden]);

  const max = Math.max(1, ...meses.map(([, v]) => v[metrica]));
  const totNoches = estadias.reduce((s, e) => s + e.noches, 0);
  const totIngresos = estadias.reduce((s, e) => s + e.total, 0);

  const descargar = async () => {
    if (!db) return;
    setBajando(true);
    await sleep(700);
    const nombre = (id: string) => db.props.find((p) => p.id === id)?.nombre ?? id;
    const filas = [["propiedad", "entrada", "noches", "huesped", "pais", "total_usd"], ...estadias.map((e) => [nombre(e.prop), e.entrada, String(e.noches), e.huesped, e.pais, String(e.total)])];
    const csv = "﻿" + filas.map((f) => f.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial-airbnb${prop ? "-" + nombre(prop).toLowerCase().replace(/\s+/g, "-") : ""}${anio ? "-" + anio : ""}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setBajando(false);
  };

  return (
    <div className="pagina">
      <div className="pg-head">
        <div>
          <span className="eyebrow">
            <History size={14} /> Lo que no viaja
          </span>
          <h1>Historial que se queda en Airbnb</h1>
          <p>Smoobu se trae las reservas de hoy en adelante y arranca con la libreta en blanco. Las estadías anteriores siguen en Airbnb, y aquí quedan en una planilla por propiedad y por mes, para comparar este enero con el anterior el día que haga falta.</p>
        </div>
        <div className="pg-acc">
          <Btn className="btn-primary" cargando={bajando} onClick={descargar}>
            {!bajando && <Download size={16} />} {bajando ? "Armando la planilla" : "Descargar planilla"}
          </Btn>
        </div>
      </div>

      {!db ? (
        <div className="grid g-kpi">
          {[0, 1, 2, 3].map((i) => (
            <Skel key={i} h={128} r={18} />
          ))}
        </div>
      ) : (
        <>
          <div className="toolbar">
            <select value={prop} onChange={(e) => setProp(e.target.value)} aria-label="Filtrar por propiedad">
              <option value="">Las 12 propiedades</option>
              {db.props.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <select value={anio} onChange={(e) => setAnio(e.target.value)} aria-label="Filtrar por año">
              <option value="">2025 y 2026</option>
              <option value="2025">Solo 2025</option>
              <option value="2026">Solo 2026</option>
            </select>
            <div className="segmento" role="tablist" aria-label="Qué medir">
              <button role="tab" aria-selected={metrica === "ingresos"} className={metrica === "ingresos" ? "on" : ""} onClick={() => setMetrica("ingresos")}>
                Ingresos
              </button>
              <button role="tab" aria-selected={metrica === "noches"} className={metrica === "noches" ? "on" : ""} onClick={() => setMetrica("noches")}>
                Noches
              </button>
            </div>
          </div>

          <section className="grid g-kpi">
            <Kpi icono={<CalendarDays size={20} />} valor={miles(estadias.length)} rotulo="Estadías pasadas" nota="Solo en Airbnb después de conectar" />
            <Kpi icono={<BedDouble size={20} />} valor={miles(totNoches)} rotulo="Noches vendidas" tono="ok" />
            <Kpi icono={<Wallet size={20} />} valor={usd(totIngresos)} rotulo="Ingresos con limpieza" tono="clay" />
            <Kpi icono={<FileSpreadsheet size={20} />} valor={estadias.length ? (totNoches / estadias.length).toFixed(1).replace(".", ",") : "0"} rotulo="Noches por estadía" nota="Promedio" tono="warn" />
          </section>

          <section className="card grafico-card">
            <div className="card-head">
              <h3>{metrica === "ingresos" ? "Ingresos por mes" : "Noches por mes"}</h3>
              <span className="muted small">{prop ? db.props.find((p) => p.id === prop)?.nombre : "Toda la cartera"}</span>
            </div>
            <div className="grafico" role="img" aria-label={`${metrica} por mes`}>
              {meses.map(([k, v], i) => {
                const h = (v[metrica] / max) * 100;
                return (
                  <div key={k} className="barra-mes" title={`${mesLargo(k)}: ${metrica === "ingresos" ? usd(v.ingresos) : `${v.noches} noches`}`}>
                    <span className="bm-valor">{metrica === "ingresos" ? miles(Math.round(v.ingresos / 1000)) + " mil" : v.noches}</span>
                    <div className="bm-col" style={{ height: `${Math.max(2, h)}%`, animationDelay: `${i * 30}ms` }} />
                    <span className="bm-mes">{mesCorto(k)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h3>Por propiedad</h3>
              <label className="orden">
                <ArrowDownUp size={15} />
                <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)} aria-label="Ordenar propiedades">
                  <option value="ingresos">Por ingresos</option>
                  <option value="noches">Por noches</option>
                  <option value="estadias">Por estadías</option>
                  <option value="nombre">Por nombre</option>
                </select>
              </label>
            </div>
            <div className="props-hist">
              {porProp.map((r, i) => (
                <Tilt key={r.p.id} className={`ph ${prop === r.p.id ? "on" : ""}`} fuerza={5} style={{ animationDelay: `${i * 35}ms` }}>
                  <button className="ph-btn" onClick={() => setProp(prop === r.p.id ? "" : r.p.id)} aria-pressed={prop === r.p.id}>
                    <FotoProp p={r.p} w={64} h={48} className="mini" />
                    <span className="ph-txt">
                      <b>{r.p.nombre}</b>
                      <span className="muted small">
                        {r.estadias} estadías · {miles(r.noches)} noches{r.mejor ? ` · mejor mes ${mesCorto(r.mejor)}` : ""}
                      </span>
                    </span>
                    <span className="ph-monto">{usd(r.ingresos)}</span>
                  </button>
                </Tilt>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
