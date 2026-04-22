// src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import MuiTooltip from "@mui/material/Tooltip";

const API_URL = import.meta.env.VITE_API_URL;

const muiTheme = createTheme({
  palette: { mode: "light" },
  typography: { fontFamily: "'Inter', sans-serif" },
});

const P = {
  azul: "#1d4ed8", azulC: "#3b82f6", verde: "#059669", verdeC: "#10b981",
  amarelo: "#d97706", amareloC: "#f59e0b", vermelho: "#dc2626", vermelhoC: "#ef4444",
  roxo: "#7c3aed", cinza: "#64748b",
  bg: "#0f172a", bgCard: "#1e293b", bgCardH: "#263548",
  border: "#334155", text: "#f1f5f9", textM: "#94a3b8",
};

const fmt = (v, d = 2) =>
  typeof v === "number" ? v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—";

const corEfic  = (v, meta) => meta == null ? P.azulC  : v >= meta ? P.verdeC : v >= meta * 0.85 ? P.amareloC : P.vermelhoC;
const corPerda = (v, meta) => meta == null ? P.azulC  : v <= meta * 0.6 ? P.verdeC : v <= meta ? P.amareloC : P.vermelhoC;

// ── StatusBadge ───────────────────────────────────────────────────────────────
function Badge({ v, metas, tipo }) {
  const meta = tipo === "refugo" ? metas.metaRefugo : tipo === "retalho" ? metas.metaRetalho
    : tipo === "perdas" ? metas.metaPerdas : metas.metaEficiencia;

  // Se não há meta definida, não exibe badge
  if (meta == null) return null;

  const invert = tipo !== "efic";
  let cor, label;
  if (invert) {
    cor = v <= meta * 0.6 ? P.verdeC : v <= meta ? P.amareloC : P.vermelhoC;
    label = v <= meta * 0.6 ? "Ótimo" : v <= meta ? "Atenção" : "Crítico";
  } else {
    cor = v >= meta ? P.verdeC : v >= meta * 0.85 ? P.amareloC : P.vermelhoC;
    label = v >= meta ? "Ótimo" : v >= meta * 0.85 ? "Regular" : "Baixo";
  }
  return (
    <span style={{ background: cor + "25", color: cor, border: `1px solid ${cor}50`,
      borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700 }}>{label}</span>
  );
}

// ── KpiCard ───────────────────────────────────────────────────────────────────
function KpiCard({ titulo, valor, unidade, valorKg, descricao, cor, alerta, badge, meta }) {
  const [hov, setHov] = useState(false);
  return (
    <MuiTooltip title={valorKg !== undefined ? `${fmt(valorKg)} kg` : ""} placement="top" arrow>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 16,
          padding: "20px 22px", position: "relative", overflow: "hidden",
          boxShadow: "0 2px 8px #00000030",
          transform: hov ? "translateY(-2px)" : "none", transition: "all 0.2s" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${cor}, ${cor}80)`, borderRadius: "16px 16px 0 0" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: P.textM, textTransform: "uppercase",
            letterSpacing: 1, margin: 0 }}>{titulo}</p>
          {badge}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <p style={{ fontSize: 32, fontWeight: 800, color: hov && valorKg !== undefined ? P.textM : P.text,
            margin: 0, transition: "color 0.2s", fontFamily: "monospace" }}>
            {hov && valorKg !== undefined ? fmt(valorKg) : (typeof valor === "number" ? fmt(valor) : valor)}
          </p>
          <span style={{ fontSize: 14, color: P.textM, fontWeight: 500 }}>
            {hov && valorKg !== undefined ? "kg" : unidade}
          </span>
        </div>

        {valorKg !== undefined && (
          <p style={{ fontSize: 10, color: P.textM, margin: "3px 0 0", opacity: hov ? 0 : 1, transition: "opacity 0.2s" }}>
            passe o mouse → ver em kg
          </p>
        )}
        {descricao && !valorKg && <p style={{ fontSize: 11, color: P.textM, margin: "6px 0 0" }}>{descricao}</p>}
        {alerta && <p style={{ fontSize: 11, color: cor, margin: "6px 0 0", fontWeight: 600 }}>{alerta}</p>}

        {/* Barra de meta */}
        {meta != null && typeof valor === "number" && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: P.textM }}>Meta: {meta}{unidade}</span>
              <span style={{ fontSize: 10, color: cor }}>{valor}{unidade}</span>
            </div>
            <div style={{ height: 4, background: P.border, borderRadius: 4 }}>
              <div style={{ height: "100%", width: `${Math.min((valor / (meta * 1.5)) * 100, 100)}%`,
                background: cor, borderRadius: 4, transition: "width 0.6s" }} />
            </div>
          </div>
        )}
      </div>
    </MuiTooltip>
  );
}

// ── Secao ─────────────────────────────────────────────────────────────────────
function Secao({ titulo, sub, children, id }) {
  return (
    <div style={{ marginBottom: 40 }} id={id}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: P.text, margin: 0 }}>{titulo}</h3>
        {sub && <p style={{ fontSize: 13, color: P.textM, margin: "4px 0 0" }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Tabela analítica ──────────────────────────────────────────────────────────
function Tabela({ dados, colunas, chave, sel, onSel }) {
  return (
    <div style={{ background: P.bgCard, borderRadius: 16, border: `1px solid ${P.border}`, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#0f172a" }}>
            {colunas.map(c => (
              <th key={c.key} style={{ padding: "12px 16px", textAlign: c.align || "left",
                color: P.textM, fontWeight: 600, fontSize: 11,
                textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados.map((row, i) => (
            <tr key={row[chave]} onClick={() => onSel?.(sel === row[chave] ? null : row[chave])}
              style={{ background: sel === row[chave] ? "#1d4ed820" : i % 2 === 0 ? P.bgCard : "#172033",
                borderLeft: sel === row[chave] ? `3px solid ${P.azulC}` : "3px solid transparent",
                cursor: onSel ? "pointer" : "default", transition: "background 0.15s" }}>
              {colunas.map(c => (
                <td key={c.key} style={{ padding: "11px 16px", color: P.text,
                  textAlign: c.align || "left", borderBottom: `1px solid ${P.border}20` }}>
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── MotivoCard ────────────────────────────────────────────────────────────────
function MotivoCard({ motivo, quantidade, kg, percentual, cor, rank }) {
  return (
    <div style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 12,
      padding: "14px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0,
        width: `${percentual}%`, background: cor + "12", transition: "width 0.5s" }} />
      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: cor, minWidth: 24, fontFamily: "monospace" }}>#{rank}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: P.text, lineHeight: 1.4 }}>{motivo}</p>
          <div style={{ display: "flex", gap: 14, marginTop: 5 }}>
            <span style={{ fontSize: 12, color: P.textM }}><strong style={{ color: cor }}>{quantidade}×</strong> ocorrências</span>
            {kg > 0 && <span style={{ fontSize: 12, color: P.textM }}><strong style={{ color: P.text }}>{fmt(kg)} {kg < 100 ? "h" : "kg"}</strong> acumulado</span>}
          </div>
          <div style={{ marginTop: 7, height: 4, background: P.border, borderRadius: 4 }}>
            <div style={{ height: "100%", width: `${percentual}%`, background: cor, borderRadius: 4, transition: "width 0.6s" }} />
          </div>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, color: P.textM, fontFamily: "monospace" }}>{percentual.toFixed(0)}%</span>
      </div>
    </div>
  );
}

// ── Modal de Metas ────────────────────────────────────────────────────────────
function ModalMetas({ metas, onSalvar, onFechar }) {
  // Inicializa com os valores atuais (null = sem meta definida)
  const [form, setForm] = useState({
    metaRefugo:     metas.metaRefugo     ?? "",
    metaRetalho:    metas.metaRetalho    ?? "",
    metaPerdas:     metas.metaPerdas     ?? "",
    metaEficiencia: metas.metaEficiencia ?? "",
  });

  const inp = { background: "#0f172a", border: `1px solid ${P.border}`, borderRadius: 8,
    padding: "9px 12px", color: P.text, fontSize: 14, outline: "none", width: "100%",
    boxSizing: "border-box", colorScheme: "dark" };

  const handleSalvar = () => {
    // Converte string vazia para null (sem meta)
    onSalvar({
      metaRefugo:     form.metaRefugo     !== "" ? parseFloat(form.metaRefugo)     : null,
      metaRetalho:    form.metaRetalho    !== "" ? parseFloat(form.metaRetalho)    : null,
      metaPerdas:     form.metaPerdas     !== "" ? parseFloat(form.metaPerdas)     : null,
      metaEficiencia: form.metaEficiencia !== "" ? parseFloat(form.metaEficiencia) : null,
    });
  };

  const CAMPOS = [
    { key: "metaRefugo",    label: "Meta de Refugo",    unidade: "%", desc: "Taxa máxima aceitável. Ex: 3 significa que acima de 3% o indicador fica vermelho.", placeholder: "Ex: 3" },
    { key: "metaRetalho",   label: "Meta de Retalho",   unidade: "%", desc: "Taxa máxima aceitável de retalho.", placeholder: "Ex: 5" },
    { key: "metaPerdas",    label: "Meta de Perdas",    unidade: "%", desc: "Índice máximo de perdas totais (refugo + retalho).", placeholder: "Ex: 8" },
    { key: "metaEficiencia",label: "Meta de Eficiência",unidade: "%", desc: "Eficiência mínima esperada. Ex: 90 significa que abaixo de 90% fica vermelho.", placeholder: "Ex: 90" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000bb", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 20,
        padding: 32, width: "100%", maxWidth: 500, boxShadow: "0 24px 64px #00000080" }}>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: P.text, margin: "0 0 6px" }}>⚙️ Configurar Metas</h3>
        <p style={{ fontSize: 13, color: P.textM, margin: "0 0 6px" }}>
          Defina os limites de referência para cada KPI. Os cards mudarão de cor automaticamente.
        </p>
        <div style={{ background: "#1d4ed815", border: `1px solid ${P.azul}40`, borderRadius: 8,
          padding: "8px 14px", marginBottom: 24, fontSize: 12, color: P.textM }}>
          💡 Deixe o campo <strong style={{ color: P.text }}>em branco</strong> para não definir meta para aquele KPI — o indicador ficará no padrão sem avaliação de cor.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {CAMPOS.map(f => (
            <div key={f.key} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: P.textM,
                    textTransform: "uppercase", letterSpacing: 0.6 }}>{f.label}</label>
                  {form[f.key] !== "" && (
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, [f.key]: "" }))}
                      style={{ background: "none", border: "none", color: P.textM, cursor: "pointer",
                        fontSize: 11, padding: 0, textDecoration: "underline" }}>
                      remover meta
                    </button>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <input type="number" value={form[f.key]} min="0" max="100" step="0.5"
                    placeholder={form[f.key] === "" ? `Sem meta (${f.placeholder})` : ""}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ ...inp, paddingRight: 36 }} />
                  <span style={{ position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)", fontSize: 13, color: P.textM }}>{f.unidade}</span>
                </div>
                <p style={{ fontSize: 11, color: P.textM, margin: "4px 0 0" }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onFechar} style={{ background: "transparent", border: `1px solid ${P.border}`,
            borderRadius: 8, padding: "9px 18px", color: P.textM, fontSize: 13, cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={handleSalvar} style={{ background: P.azul, border: "none",
            borderRadius: 8, padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            ✓ Salvar Metas
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const dashRef = useRef(null);
  const [dados, setDados] = useState(null);
  const [metas, setMetas] = useState({ metaRefugo: null, metaRetalho: null, metaPerdas: null, metaEficiencia: null });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [modalMetas, setModalMetas] = useState(false);

  const hoje = new Date().toISOString().split("T")[0];
  const trintaDias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [dataInicio, setDataInicio] = useState(trintaDias);
  const [dataFim, setDataFim]       = useState(hoje);
  const [setor, setSetor]           = useState("");
  const [turno, setTurno]           = useState("");
  const [turnoSel, setTurnoSel]     = useState(null);
  const [linhaSel, setLinhaSel]     = useState(null);

  const buscarMetas = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/metas`);
      if (res.data.success) setMetas(res.data.data);
    } catch {}
  };

  const buscarDados = useCallback(async () => {
    setLoading(true); setErro(null);
    try {
      const params = { dataInicio, dataFim };
      if (setor) params.setor = setor;
      if (turno) params.turno = turno;
      const res = await axios.get(`${API_URL}/api/dashboard`, { params });
      if (res.data.success) setDados(res.data.data);
    } catch { setErro("Erro ao carregar dados."); }
    finally { setLoading(false); }
  }, [dataInicio, dataFim, setor, turno]);

  useEffect(() => { buscarMetas(); buscarDados(); }, []);

  const salvarMetas = async (novasMetas) => {
    try {
      await axios.put(`${API_URL}/api/metas`, novasMetas);
      setMetas(novasMetas);
      setModalMetas(false);
    } catch { alert("Erro ao salvar metas."); }
  };

  const exportarPDF = async () => {
    setExportando(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"), import("jspdf"),
      ]);
      const canvas = await html2canvas(dashRef.current, { scale: 1.5, backgroundColor: P.bg });
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`dashboard-${hoje}.pdf`);
    } catch { alert("Erro ao exportar."); }
    finally { setExportando(false); }
  };

  const dadosTurno = dados?.eficienciaPorTurno || [];
  const dadosLinha = dados?.eficienciaPorLinha || [];
  const tendDatas  = dados?.tendenciaRefugo?.map(r => r.data) || [];
  const tendRefugo = dados?.tendenciaRefugo?.map(r => r.taxaRefugo) || [];
  const tendRetalho= dados?.tendenciaRefugo?.map(r => r.taxaRetalho) || [];
  const top10      = dados?.top10Produtos || [];

  const mediaRefugo = tendRefugo.length
    ? (tendRefugo.reduce((a, b) => a + b, 0) / tendRefugo.length).toFixed(2) : 0;

  const kpiTurno = turnoSel ? dadosTurno.find(t => t.turno === turnoSel) : null;
  const selAtiva = turnoSel || linhaSel;

  const inputSt = { background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 8,
    padding: "8px 12px", color: P.text, fontSize: 13, outline: "none", colorScheme: "dark" };

  // Motivos vindos do backend
  const motivosRefugo  = (dados?.motivosRefugo  || []).map((m, i) => ({ ...m, percentual: i === 0 ? 100 : (m.quantidade / (dados.motivosRefugo[0]?.quantidade || 1)) * 100 }));
  const motivosRetalho = (dados?.motivosRetalho || []).map((m, i) => ({ ...m, percentual: i === 0 ? 100 : (m.quantidade / (dados.motivosRetalho[0]?.quantidade || 1)) * 100 }));
  const motivosParada  = (dados?.motivosParada  || []).map((m, i) => ({ ...m, percentual: i === 0 ? 100 : (m.quantidade / (dados.motivosParada[0]?.quantidade || 1)) * 100 }));

  if (loading) return (
    <div style={{ minHeight: "100vh", background: P.bg, display: "flex", alignItems: "center",
      justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 48, height: 48, border: `3px solid ${P.border}`, borderTop: `3px solid ${P.azulC}`,
        borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: P.textM, fontSize: 14 }}>Carregando dashboard...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <ThemeProvider theme={muiTheme}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: P.bg, padding: "28px 32px", fontFamily: "'Inter', sans-serif", color: P.text }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>

          {/* Cabeçalho */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: P.verdeC, boxShadow: `0 0 8px ${P.verdeC}` }} />
                <span style={{ fontSize: 12, color: P.verdeC, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Live Dashboard</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Produção Himaflex</h1>
              <p style={{ fontSize: 13, color: P.textM, margin: "4px 0 0" }}>
                {setor || "Todos os setores"} · {turno ? `Turno ${turno}` : "Todos os turnos"} · {dataInicio} → {dataFim}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setModalMetas(true)} style={{ background: P.bgCard, border: `1px solid ${P.border}`,
                borderRadius: 10, padding: "10px 18px", color: P.text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ⚙️ Metas
              </button>
              <button onClick={exportarPDF} disabled={exportando} style={{ background: `linear-gradient(135deg, ${P.azul}, ${P.azulC})`,
                border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: exportando ? 0.6 : 1 }}>
                {exportando ? "⏳ Exportando..." : "⬇ Exportar PDF"}
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 16,
            padding: "18px 24px", marginBottom: 28, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
            {[{ l: "Data início", t: "date", v: dataInicio, s: setDataInicio },
              { l: "Data fim",    t: "date", v: dataFim,    s: setDataFim }].map(f => (
              <div key={f.l}>
                <label style={{ display: "block", fontSize: 11, color: P.textM, marginBottom: 5,
                  fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7 }}>{f.l}</label>
                <input type={f.t} value={f.v} onChange={e => f.s(e.target.value)} style={inputSt} />
              </div>
            ))}
            {[{ l: "Setor", v: setor, s: setSetor, opts: dados?.setoresDisponiveis || [] },
              { l: "Turno", v: turno, s: setTurno, opts: dados?.turnosDisponiveis || [] }].map(f => (
              <div key={f.l}>
                <label style={{ display: "block", fontSize: 11, color: P.textM, marginBottom: 5,
                  fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7 }}>{f.l}</label>
                <select value={f.v} onChange={e => f.s(e.target.value)} style={{ ...inputSt, minWidth: 150 }}>
                  <option value="">Todos</option>
                  {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <button onClick={buscarDados} style={{ background: P.azul, border: "none", borderRadius: 8,
              padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Aplicar
            </button>
            {(setor || turno) && (
              <button onClick={() => { setSetor(""); setTurno(""); }} style={{ background: "transparent",
                border: `1px solid ${P.border}`, borderRadius: 8, padding: "9px 14px",
                color: P.textM, fontSize: 13, cursor: "pointer" }}>✕ Limpar</button>
            )}
            <button onClick={() => { setDataInicio(trintaDias); setDataFim(hoje); }}
              style={{ marginLeft: "auto", background: "transparent", border: "none",
                color: P.textM, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
              Últimos 30 dias
            </button>
          </div>

          {/* Aviso metas */}
          <div style={{ background: "#1d4ed810", border: `1px solid ${P.azul}30`, borderRadius: 10,
            padding: "10px 18px", marginBottom: 20, fontSize: 12, color: P.textM,
            display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <span>📊 Metas:</span>
            {[{ l: "Refugo", v: metas.metaRefugo, u: "%" }, { l: "Retalho", v: metas.metaRetalho, u: "%" },
              { l: "Perdas", v: metas.metaPerdas, u: "%" }, { l: "Eficiência", v: metas.metaEficiencia, u: "%" }].map(m => (
              <span key={m.l}>
                <strong style={{ color: P.text }}>{m.l}:</strong>{" "}
                {m.v != null
                  ? <span style={{ color: P.amareloC }}>{m.v}{m.u}</span>
                  : <span style={{ color: P.border, fontStyle: "italic" }}>sem meta</span>}
              </span>
            ))}
            <span style={{ marginLeft: "auto", cursor: "pointer", color: P.azulC, textDecoration: "underline" }}
              onClick={() => setModalMetas(true)}>Configurar →</span>
          </div>

          {selAtiva && (
            <div style={{ background: "#1d4ed815", border: `1px solid ${P.azulC}40`, borderRadius: 10,
              padding: "10px 18px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: P.azulC }}>
                🔍 Filtrando: <strong>{turnoSel ? `Turno ${turnoSel}` : `Linha ${linhaSel}`}</strong>
              </span>
              <button onClick={() => { setTurnoSel(null); setLinhaSel(null); }}
                style={{ background: "transparent", border: "none", color: P.azulC, cursor: "pointer", fontWeight: 700 }}>
                ✕ Limpar
              </button>
            </div>
          )}

          {erro && (
            <div style={{ background: "#dc262620", border: `1px solid ${P.vermelhoC}`,
              borderRadius: 10, padding: 16, marginBottom: 20, color: P.vermelhoC }}>{erro}</div>
          )}

          <div ref={dashRef}>

            {/* KPIs */}
            <Secao titulo="KPIs Principais" sub={kpiTurno ? `Dados do Turno ${turnoSel}` : "Visão geral do período"}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
                <KpiCard titulo="Produção Total" unidade="kg" cor={P.azulC}
                  valor={kpiTurno ? kpiTurno.producao : dados?.producaoTotal ?? 0}
                  descricao="Volume total produzido" />
                <KpiCard titulo="Taxa de Refugo" unidade="%" cor={corPerda(dados?.taxaRefugo || 0, metas.metaRefugo)}
                  valor={dados?.taxaRefugo ?? 0} valorKg={kpiTurno ? kpiTurno.refugo : dados?.refugoTotal}
                  meta={metas.metaRefugo}
                  alerta={metas.metaRefugo != null && dados?.taxaRefugo > metas.metaRefugo ? "⚠ Acima da meta" : metas.metaRefugo != null ? "✓ Dentro da meta" : null}
                  badge={<Badge v={dados?.taxaRefugo||0} metas={metas} tipo="refugo" />} />
                <KpiCard titulo="Taxa de Retalho" unidade="%" cor={corPerda(dados?.taxaRetalho || 0, metas.metaRetalho)}
                  valor={dados?.taxaRetalho ?? 0} valorKg={kpiTurno ? kpiTurno.retalho : dados?.retalhoTotal}
                  meta={metas.metaRetalho}
                  badge={<Badge v={dados?.taxaRetalho||0} metas={metas} tipo="retalho" />} />
                <KpiCard titulo="Índice de Perdas" unidade="%" cor={corPerda(dados?.indicePerdas || 0, metas.metaPerdas)}
                  valor={dados?.indicePerdas ?? 0} meta={metas.metaPerdas}
                  alerta={dados?.indicePerdas > metas.metaPerdas ? "⚠ Alto desperdício" : null}
                  badge={<Badge v={dados?.indicePerdas||0} metas={metas} tipo="perdas" />} />
                <KpiCard titulo="Eficiência" unidade="%" cor={corEfic(kpiTurno?.eficiencia || dados?.eficiencia || 0, metas.metaEficiencia)}
                  valor={kpiTurno ? kpiTurno.eficiencia : dados?.eficiencia ?? 0}
                  meta={metas.metaEficiencia}
                  badge={<Badge v={kpiTurno?.eficiencia||dados?.eficiencia||0} metas={metas} tipo="efic" />} />
                <KpiCard titulo="Taxa de Produção" unidade="kg/h" cor={P.roxo}
                  valor={kpiTurno ? kpiTurno.produtividade : dados?.taxaProducao ?? 0}
                  descricao="Ritmo médio por hora" />
                <KpiCard titulo="Tempo Médio de Parada" unidade="h" cor={dados?.tempoMedioParada > 2 ? P.vermelhoC : P.cinza}
                  valor={dados?.tempoMedioParada ?? 0}
                  alerta={dados?.tempoMedioParada > 2 ? "⚠ Acima de 2h" : null} />
                <KpiCard titulo="Registros no Período" unidade="" cor={P.cinza}
                  valor={dados?.totalRegistros ?? 0} descricao="Formulários lançados" />
              </div>
            </Secao>

            {/* Top 10 Produtos */}
            {top10.length > 0 && (
              <Secao titulo="Top 10 Produtos Fabricados" sub="Ranking por kg produzidos — clique para ver detalhes">
                <div style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 16, padding: "24px 20px" }}>
                  <BarChart
                    dataset={top10}
                    series={[{ dataKey: "prodKg", label: "Produção (kg)",
                      valueFormatter: v => `${fmt(v)} kg`, color: P.azulC }]}
                    layout="horizontal"
                    height={Math.max(300, top10.length * 44)}
                    xAxis={[{ tickLabelStyle: { fill: P.textM, fontSize: 11 }, label: "kg produzidos" }]}
                    yAxis={[{ scaleType: "band", dataKey: "produto", width: 220,
                      tickLabelStyle: { fill: P.text, fontSize: 12, fontWeight: 600 } }]}
                    grid={{ vertical: true }}
                    margin={{ left: 230, right: 40, top: 10, bottom: 50 }}
                    sx={{
                      "& .MuiChartsAxis-line": { stroke: P.border },
                      "& .MuiChartsGrid-line": { stroke: P.border, opacity: 0.3 },
                      "& .MuiChartsAxis-tickLabel": { fill: P.textM },
                    }}
                  />
                </div>
              </Secao>
            )}

            {/* Tendência */}
            {tendDatas.length > 1 && (
              <Secao titulo="Tendência de Refugo & Retalho (%)"
                sub={`Média do período: ${mediaRefugo}% — acompanhe a evolução das taxas`}>
                <div style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 16, padding: "24px 20px" }}>
                  <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
                    {[
                      { l: "Média Refugo", v: `${mediaRefugo}%`, c: P.vermelhoC },
                      { l: "Última taxa", v: `${tendRefugo[tendRefugo.length - 1] ?? 0}%`, c: corPerda(tendRefugo[tendRefugo.length - 1] || 0, metas.metaRefugo) },
                      { l: "Tendência", c: P.textM, v: tendRefugo.length > 2 ? (tendRefugo[tendRefugo.length-1] > tendRefugo[tendRefugo.length-2] ? "📈 Subindo" : "📉 Caindo") : "—" },
                      { l: "Meta Refugo", v: `${metas.metaRefugo}%`, c: P.amareloC },
                    ].map(s => (
                      <div key={s.l} style={{ background: "#0f172a", borderRadius: 10, padding: "10px 16px", border: `1px solid ${P.border}` }}>
                        <p style={{ margin: 0, fontSize: 11, color: P.textM, textTransform: "uppercase", letterSpacing: 0.8 }}>{s.l}</p>
                        <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700, color: s.c, fontFamily: "monospace" }}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                  <LineChart
                    xAxis={[{ data: tendDatas, scaleType: "point", tickLabelStyle: { fill: P.textM, fontSize: 11 } }]}
                    yAxis={[{ tickLabelStyle: { fill: P.textM, fontSize: 11 }, valueFormatter: v => `${v}%` }]}
                    series={[
                      { data: tendRefugo,  label: "Taxa Refugo (%)",  color: P.vermelhoC, area: true, curve: "monotoneX", valueFormatter: v => `${v}%` },
                      { data: tendRetalho, label: "Taxa Retalho (%)", color: P.amareloC,  area: true, curve: "monotoneX", strokeDasharray: "5 3", valueFormatter: v => `${v}%` },
                    ]}
                    height={260}
                    grid={{ horizontal: true }}
                    margin={{ left: 50, right: 20, top: 10, bottom: 40 }}
                    sx={{
                      "& .MuiChartsAxis-line": { stroke: P.border },
                      "& .MuiChartsGrid-line": { stroke: P.border, opacity: 0.3 },
                      "& .MuiAreaElement-series-0": { fill: `${P.vermelhoC}20` },
                      "& .MuiAreaElement-series-1": { fill: `${P.amareloC}15` },
                    }}
                  />
                </div>
              </Secao>
            )}

            {/* Análise por Turno */}
            {dadosTurno.length > 0 && (
              <Secao titulo="Análise por Turno" sub="Clique em uma linha ou barra para filtrar o dashboard">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 16, padding: 20 }}>
                    <BarChart
                      dataset={turnoSel ? dadosTurno.filter(t => t.turno === turnoSel) : dadosTurno}
                      series={[
                        { dataKey: "producao", label: "Produção (kg)", color: P.azulC,
                          valueFormatter: (v, { dataIndex }) => {
                            const row = (turnoSel ? dadosTurno.filter(t => t.turno === turnoSel) : dadosTurno)[dataIndex];
                            return `${fmt(v)} kg · Refugo: ${row?.taxaRefugo ?? 0}% · Retalho: ${row?.taxaRetalho ?? 0}%`;
                          }},
                        { dataKey: "refugo", label: "Refugo (kg)", color: P.vermelhoC,
                          valueFormatter: (v, { dataIndex }) => {
                            const row = (turnoSel ? dadosTurno.filter(t => t.turno === turnoSel) : dadosTurno)[dataIndex];
                            return `${fmt(v)} kg (${row?.taxaRefugo ?? 0}%)`;
                          }},
                        { dataKey: "retalho", label: "Retalho (kg)", color: P.amareloC,
                          valueFormatter: (v, { dataIndex }) => {
                            const row = (turnoSel ? dadosTurno.filter(t => t.turno === turnoSel) : dadosTurno)[dataIndex];
                            return `${fmt(v)} kg (${row?.taxaRetalho ?? 0}%)`;
                          }},
                      ]}
                      xAxis={[{ scaleType: "band", dataKey: "turno", tickLabelStyle: { fill: P.textM, fontSize: 12 } }]}
                      yAxis={[{ tickLabelStyle: { fill: P.textM, fontSize: 11 } }]}
                      height={240}
                      onAxisClick={(_, d) => { const t = d?.axisValue; setTurnoSel(turnoSel === t ? null : t); setLinhaSel(null); }}
                      grid={{ horizontal: true }}
                      margin={{ left: 60, right: 10, top: 10, bottom: 30 }}
                      sx={{ "& .MuiChartsAxis-line": { stroke: P.border }, "& .MuiChartsGrid-line": { stroke: P.border, opacity: 0.3 }, cursor: "pointer" }}
                    />
                    <p style={{ fontSize: 11, color: P.textM, textAlign: "center", margin: "6px 0 0" }}>
                      💡 Passe o mouse para ver refugo e retalho em % · Clique para filtrar
                    </p>
                  </div>
                  <Tabela dados={dadosTurno} chave="turno" sel={turnoSel}
                    onSel={t => { setTurnoSel(t); setLinhaSel(null); }}
                    colunas={[
                      { key: "turno",       label: "Turno",    render: v => <strong style={{ color: P.text }}>{v}</strong> },
                      { key: "producao",    label: "Produção", align: "right", render: v => <span style={{ fontFamily: "monospace" }}>{fmt(v)} kg</span> },
                      { key: "taxaRefugo",  label: "Refugo",   align: "right", render: v => <span style={{ color: corPerda(v, metas.metaRefugo), fontWeight: 700, fontFamily: "monospace" }}>{v}%</span> },
                      { key: "taxaRetalho", label: "Retalho",  align: "right", render: v => <span style={{ color: corPerda(v, metas.metaRetalho), fontWeight: 700, fontFamily: "monospace" }}>{v}%</span> },
                      { key: "eficiencia",  label: "Efic.",    align: "right", render: v => <span style={{ color: corEfic(v, metas.metaEficiencia), fontWeight: 700, fontFamily: "monospace" }}>{v}%</span> },
                      { key: "horasParadas",label: "Paradas",  align: "right", render: v => <span style={{ color: v > 2 ? P.vermelhoC : P.textM, fontFamily: "monospace" }}>{v}h</span> },
                    ]} />
                </div>
              </Secao>
            )}

            {/* Análise por Linha */}
            {dadosLinha.length > 0 && (
              <Secao titulo="Análise por Linha" sub="Performance de cada linha de produção">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 16, padding: 20 }}>
                    <BarChart
                      dataset={linhaSel ? dadosLinha.filter(l => l.linha === linhaSel) : dadosLinha}
                      series={[
                        { dataKey: "producao", label: "Produção (kg)", color: P.azulC,
                          valueFormatter: (v, { dataIndex }) => {
                            const row = (linhaSel ? dadosLinha.filter(l => l.linha === linhaSel) : dadosLinha)[dataIndex];
                            return `${fmt(v)} kg · Refugo: ${row?.taxaRefugo ?? 0}% · Retalho: ${row?.taxaRetalho ?? 0}%`;
                          }},
                        { dataKey: "refugo", label: "Refugo (kg)", color: P.vermelhoC,
                          valueFormatter: (v, { dataIndex }) => {
                            const row = (linhaSel ? dadosLinha.filter(l => l.linha === linhaSel) : dadosLinha)[dataIndex];
                            return `${fmt(v)} kg (${row?.taxaRefugo ?? 0}%)`;
                          }},
                        { dataKey: "retalho", label: "Retalho (kg)", color: P.amareloC,
                          valueFormatter: (v, { dataIndex }) => {
                            const row = (linhaSel ? dadosLinha.filter(l => l.linha === linhaSel) : dadosLinha)[dataIndex];
                            return `${fmt(v)} kg (${row?.taxaRetalho ?? 0}%)`;
                          }},
                      ]}
                      xAxis={[{ scaleType: "band", dataKey: "linha", tickLabelStyle: { fill: P.textM, fontSize: 12 } }]}
                      yAxis={[{ tickLabelStyle: { fill: P.textM, fontSize: 11 } }]}
                      height={240}
                      onAxisClick={(_, d) => { const l = d?.axisValue; setLinhaSel(linhaSel === l ? null : l); setTurnoSel(null); }}
                      grid={{ horizontal: true }}
                      margin={{ left: 60, right: 10, top: 10, bottom: 30 }}
                      sx={{ "& .MuiChartsAxis-line": { stroke: P.border }, "& .MuiChartsGrid-line": { stroke: P.border, opacity: 0.3 }, cursor: "pointer" }}
                    />
                  </div>
                  <Tabela dados={dadosLinha} chave="linha" sel={linhaSel}
                    onSel={l => { setLinhaSel(l); setTurnoSel(null); }}
                    colunas={[
                      { key: "linha",      label: "Linha",   render: v => <strong style={{ color: P.text }}>{v}</strong> },
                      { key: "producao",   label: "Produção",align: "right", render: v => <span style={{ fontFamily: "monospace" }}>{fmt(v)} kg</span> },
                      { key: "taxaRefugo", label: "Refugo",  align: "right", render: v => <span style={{ color: corPerda(v, metas.metaRefugo), fontWeight: 700, fontFamily: "monospace" }}>{v}%</span> },
                      { key: "taxaRetalho",label: "Retalho", align: "right", render: v => <span style={{ color: corPerda(v, metas.metaRetalho), fontWeight: 700, fontFamily: "monospace" }}>{v}%</span> },
                      { key: "eficiencia", label: "Efic.",   align: "right", render: v => <span style={{ color: corEfic(v, metas.metaEficiencia), fontWeight: 700, fontFamily: "monospace" }}>{v}%</span> },
                    ]} />
                </div>
              </Secao>
            )}

            {/* Motivos */}
            {(motivosRefugo.length > 0 || motivosRetalho.length > 0 || motivosParada.length > 0) && (
              <Secao titulo="Principais Motivos" sub="Top 5 causas de refugo, retalho e paradas no período">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                  {[
                    { titulo: "🔴 Motivos de Refugo",  dados: motivosRefugo,  cor: P.vermelhoC },
                    { titulo: "🟡 Motivos de Retalho", dados: motivosRetalho, cor: P.amareloC },
                    { titulo: "🔵 Motivos de Parada",  dados: motivosParada,  cor: P.azulC },
                  ].map(({ titulo, dados: md, cor }) => (
                    <div key={titulo}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: P.text, marginBottom: 12 }}>{titulo}</p>
                      {md.length === 0
                        ? <div style={{ background: P.bgCard, border: `1px solid ${P.border}`,
                            borderRadius: 12, padding: 20, textAlign: "center", color: P.textM, fontSize: 13 }}>
                            Nenhum registro no período
                          </div>
                        : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {md.map((m, i) => <MotivoCard key={m.motivo} {...m} cor={cor} rank={i + 1} />)}
                          </div>}
                    </div>
                  ))}
                </div>

                {/* Gráficos de motivos — frequência visual */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 24 }}>
                  {[
                    { titulo: "Frequência de Refugo", sub: "Quantas vezes cada motivo gerou refugo", dados: motivosRefugo,  cor: P.vermelhoC },
                    { titulo: "Frequência de Retalho",sub: "Quantas vezes cada motivo gerou retalho", dados: motivosRetalho, cor: P.amareloC },
                    { titulo: "Frequência de Paradas",sub: "Motivos mais frequentes de parada", dados: motivosParada,  cor: P.azulC },
                  ].map(({ titulo, sub, dados: md, cor }) => md.length > 0 && (
                    <div key={titulo} style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 16, padding: "20px" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: P.text, margin: "0 0 4px" }}>{titulo}</p>
                      <p style={{ fontSize: 11, color: P.textM, margin: "0 0 16px" }}>{sub}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {md.map((m, i) => (
                          <div key={m.motivo}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 12, color: P.text, fontWeight: i === 0 ? 700 : 400,
                                flex: 1, paddingRight: 8, lineHeight: 1.3 }}>{m.motivo}</span>
                              <span style={{ fontSize: 12, color: cor, fontWeight: 700,
                                fontFamily: "monospace", minWidth: 30, textAlign: "right" }}>
                                {m.quantidade}×
                              </span>
                            </div>
                            <div style={{ height: 6, background: P.border, borderRadius: 4 }}>
                              <div style={{ height: "100%", width: `${m.percentual}%`,
                                background: i === 0 ? cor : cor + "80",
                                borderRadius: 4, transition: "width 0.6s" }} />
                            </div>
                            {m.kg > 0 && (
                              <p style={{ fontSize: 10, color: P.textM, margin: "3px 0 0" }}>
                                {fmt(m.kg)} {m.kg < 50 ? "horas" : "kg"} acumulados
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Secao>
            )}

            {!dados?.totalRegistros && (
              <div style={{ textAlign: "center", padding: "60px 0", color: P.textM }}>
                <p style={{ fontSize: 18 }}>Nenhum registro encontrado</p>
                <p style={{ fontSize: 13 }}>Ajuste o período ou os filtros.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalMetas && <ModalMetas metas={metas} onSalvar={salvarMetas} onFechar={() => setModalMetas(false)} />}
    </ThemeProvider>
  );
}
