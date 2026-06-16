// src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import MuiTooltip from "@mui/material/Tooltip";
import HoseBar from "../components/HoseBar";

const API_URL = import.meta.env.VITE_API_URL;

import logoHimaflex from "../assets/logo-himaflex.png";
const muiTheme = createTheme({
  palette: { mode: "light" },
  typography: { fontFamily: "'Inter', sans-serif" },
});

// ── Paleta Himaflex ───────────────────────────────────────────────────────────
const P = {
  marca:    "#271D67",
  marcaC:   "#4535a8",
  marcaL:   "#6357c4",
  verde:    "#059669", verdeC:   "#10b981",
  amarelo:  "#d97706", amareloC: "#f59e0b",
  vermelho: "#dc2626", vermelhoC:"#ef4444",
  roxo:     "#7c3aed", cinza:    "#64748b",
  bg:       "#0b0f1e",
  bgCard:   "#151c30",
  bgCardH:  "#1c2540",
  border:   "#2a3350",
  text:     "#f1f5f9",
  textM:    "#8896b3",
};

const fmt = (v, d = 2) =>
  typeof v === "number" ? v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—";

const corEfic  = (v, meta) => meta == null ? P.marcaC : v >= meta ? P.verdeC : v >= meta * 0.85 ? P.amareloC : P.vermelhoC;
const corPerda = (v, meta) => meta == null ? P.marcaC : v <= meta * 0.6 ? P.verdeC : v <= meta ? P.amareloC : P.vermelhoC;

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ v, metas, tipo }) {
  const meta = tipo === "refugo" ? metas.metaRefugo : tipo === "retalho" ? metas.metaRetalho
    : tipo === "perdas" ? metas.metaPerdas : metas.metaEficiencia;
  if (meta == null) return null;
  const invert = tipo !== "efic";
  let cor, label;
  if (invert) {
    cor   = v <= meta * 0.6 ? P.verdeC : v <= meta ? P.amareloC : P.vermelhoC;
    label = v <= meta * 0.6 ? "Ótimo"  : v <= meta ? "Atenção"  : "Crítico";
  } else {
    cor   = v >= meta ? P.verdeC : v >= meta * 0.85 ? P.amareloC : P.vermelhoC;
    label = v >= meta ? "Ótimo"  : v >= meta * 0.85 ? "Regular"  : "Baixo";
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
        style={{ background: P.bgCard, border: `1px solid ${hov ? P.marcaC + "60" : P.border}`,
          borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden",
          boxShadow: hov ? `0 4px 20px ${P.marca}30` : "0 2px 8px #00000040",
          transform: hov ? "translateY(-2px)" : "none", transition: "all 0.2s" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${cor}, ${cor}60)`, borderRadius: "16px 16px 0 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: P.textM, textTransform: "uppercase",
            letterSpacing: 1, margin: 0 }}>{titulo}</p>
          {badge}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <p style={{ fontSize: 32, fontWeight: 800,
            color: hov && valorKg !== undefined ? P.textM : P.text,
            margin: 0, transition: "color 0.2s", fontFamily: "monospace" }}>
            {hov && valorKg !== undefined ? fmt(valorKg) : (typeof valor === "number" ? fmt(valor) : valor)}
          </p>
          <span style={{ fontSize: 14, color: P.textM, fontWeight: 500 }}>
            {hov && valorKg !== undefined ? "m" : unidade}
          </span>
        </div>
        {valorKg !== undefined && (
          <p style={{ fontSize: 10, color: P.textM, margin: "3px 0 0",
            opacity: hov ? 0 : 1, transition: "opacity 0.2s" }}>
            passe o mouse → ver em metros
          </p>
        )}
        {descricao && !valorKg && <p style={{ fontSize: 11, color: P.textM, margin: "6px 0 0" }}>{descricao}</p>}
        {alerta && <p style={{ fontSize: 11, color: cor, margin: "6px 0 0", fontWeight: 600 }}>{alerta}</p>}
        <HoseBar valor={valor} meta={meta} unidade={unidade} cor={cor} />
      </div>
    </MuiTooltip>
  );
}

// ── Secao ─────────────────────────────────────────────────────────────────────
function Secao({ titulo, sub, children, id }) {
  return (
    <div style={{ marginBottom: 40 }} id={id}>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 4, height: 22, background: `linear-gradient(180deg, ${P.marcaC}, ${P.marcaL})`,
          borderRadius: 4, flexShrink: 0 }} />
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: P.text, margin: 0 }}>{titulo}</h3>
          {sub && <p style={{ fontSize: 13, color: P.textM, margin: "3px 0 0" }}>{sub}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Tabela ────────────────────────────────────────────────────────────────────
function Tabela({ dados, colunas, chave, sel, onSel }) {
  return (
    <div style={{ background: P.bgCard, borderRadius: 16, border: `1px solid ${P.border}`, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#0b0f1e" }}>
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
              style={{ background: sel === row[chave] ? P.marca + "25" : i % 2 === 0 ? P.bgCard : "#111827",
                borderLeft: sel === row[chave] ? `3px solid ${P.marcaC}` : "3px solid transparent",
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

// ── Modal de Metas ────────────────────────────────────────────────────────────
function ModalMetas({ metas, onSalvar, onFechar }) {
  const [form, setForm] = useState({
    metaRefugo:     metas.metaRefugo     ?? "",
    metaRetalho:    metas.metaRetalho    ?? "",
    metaPerdas:     metas.metaPerdas     ?? "",
    metaEficiencia: metas.metaEficiencia ?? "",
    metaProducaoHora: metas.metaProducaoHora ?? "",
  });

  const inp = { background: "#0b0f1e", border: `1px solid ${P.border}`, borderRadius: 8,
    padding: "9px 12px", color: P.text, fontSize: 14, outline: "none", width: "100%",
    boxSizing: "border-box", colorScheme: "dark" };

  const handleSalvar = () => {
    onSalvar({
      metaRefugo:     form.metaRefugo     !== "" ? parseFloat(form.metaRefugo)     : null,
      metaRetalho:    form.metaRetalho    !== "" ? parseFloat(form.metaRetalho)    : null,
      metaPerdas:     form.metaPerdas     !== "" ? parseFloat(form.metaPerdas)     : null,
      metaEficiencia: form.metaEficiencia !== "" ? parseFloat(form.metaEficiencia) : null,
      metaProducaoHora: form.metaProducaoHora !== "" ? parseFloat(form.metaProducaoHora) : null,
    });
  };

  const CAMPOS = [
    { key: "metaRefugo",    label: "Meta de Refugo",    unidade: "%", desc: "Taxa máxima aceitável. Ex: 3 significa que acima de 3% o indicador fica vermelho.", placeholder: "Ex: 3" },
    { key: "metaRetalho",   label: "Meta de Retalho",   unidade: "%", desc: "Taxa máxima aceitável de retalho.", placeholder: "Ex: 5" },
    { key: "metaPerdas",    label: "Meta de Perdas",    unidade: "%", desc: "Índice máximo de perdas totais (refugo + retalho).", placeholder: "Ex: 8" },
    { key: "metaEficiencia",label: "Meta de Eficiência",unidade: "%", desc: "Eficiência mínima esperada. Ex: 90 significa que abaixo de 90% fica vermelho.", placeholder: "Ex: 90" },
    { key: "metaProducaoHora", label: "Meta de Produção/hora (OEE)", unidade: "kg/h", desc: "Produção esperada por hora. Usada para calcular o fator Performance do OEE. Ex: 50 significa 50 kg/h como referência.", placeholder: "Ex: 50" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 20,
        padding: 32, width: "100%", maxWidth: 500, boxShadow: `0 24px 64px #00000080, 0 0 0 1px ${P.marca}40` }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 4, height: 20, background: `linear-gradient(180deg, ${P.marcaC}, ${P.marcaL})`, borderRadius: 4 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: P.text, margin: 0 }}>⚙️ Configurar Metas</h3>
        </div>
        <p style={{ fontSize: 13, color: P.textM, margin: "0 0 6px 14px" }}>
          Defina os limites de referência para cada KPI.
        </p>
        <div style={{ background: P.marca + "15", border: `1px solid ${P.marcaC}40`, borderRadius: 8,
          padding: "8px 14px", marginBottom: 24, fontSize: 12, color: P.textM }}>
          💡 Deixe o campo <strong style={{ color: P.text }}>em branco</strong> para não definir meta — o indicador ficará no padrão sem avaliação de cor.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {CAMPOS.map(f => (
            <div key={f.key}>
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
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onFechar} style={{ background: "transparent", border: `1px solid ${P.border}`,
            borderRadius: 8, padding: "9px 18px", color: P.textM, fontSize: 13, cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={handleSalvar} style={{
            background: `linear-gradient(135deg, ${P.marca}, ${P.marcaC})`,
            border: "none", borderRadius: 8, padding: "9px 20px",
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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
  const [numFuncionarios, setNumFuncionarios] = useState(5);
  const [operadores, setOperadores] = useState([]);
  const [operadorSel, setOperadorSel] = useState("");
  const [filtroProduto, setFiltroProduto] = useState(null);
  const [turnoCardSel, setTurnoCardSel] = useState(null);

  const hoje = new Date().toISOString().split("T")[0];
  const trintaDias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [dataInicio, setDataInicio] = useState(trintaDias);
  const [dataFim, setDataFim]       = useState(hoje);
  const [setor, setSetor]           = useState("");
  const [turno, setTurno]           = useState("");

  useEffect(() => {
    if (!setor) { setOperadores([]); setOperadorSel(""); return; }
    axios.get(`${API_URL}/api/operadores/${encodeURIComponent(setor)}`)
      .then(res => { if (res.data.success) setOperadores(res.data.data); })
      .catch(() => setOperadores([]));
    setOperadorSel("");
  }, [setor]);

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
      if (setor)         params.setor   = setor;
      if (turno)         params.turno   = turno;
      if (filtroProduto) params.produto = filtroProduto;
      if (operadorSel)   params.usuario = operadorSel;
      const res = await axios.get(`${API_URL}/api/dashboard`, { params });
      if (res.data.success) setDados(res.data.data);
    } catch { setErro("Erro ao carregar dados."); }
    finally { setLoading(false); }
  }, [dataInicio, dataFim, setor, turno, filtroProduto, operadorSel]);

  useEffect(() => { buscarMetas(); }, []);
  useEffect(() => { buscarDados(); }, [buscarDados]);

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
      pdf.save(`dashboard-himaflex-${hoje}.pdf`);
    } catch { alert("Erro ao exportar."); }
    finally { setExportando(false); }
  };

  const top10 = (dados?.top10Produtos || []).filter(p => p.prodKg > 0);
  const tendDatas   = dados?.tendenciaRefugo?.map(r => r.data) || [];
  const tendRefugo  = dados?.tendenciaRefugo?.map(r => r.taxaRefugo) || [];
  const tendRetalho = dados?.tendenciaRefugo?.map(r => r.taxaRetalho) || [];
  const mediaRefugo = tendRefugo.length
    ? (tendRefugo.reduce((a, b) => a + b, 0) / tendRefugo.length).toFixed(2) : 0;

  const opData = operadorSel && dados?.producaoPorOperador
    ? (dados.producaoPorOperador.find(o => o.usuario === operadorSel) || null)
    : null;
  const producaoFiltrada     = opData ? opData.producao    : (dados?.producaoTotal  ?? 0);
  const refugoFiltrado       = opData ? opData.refugo      : (dados?.refugoTotal    ?? 0);
  const retalhoFiltrado      = opData ? opData.retalho     : (dados?.retalhoTotal   ?? 0);
  const taxaRefugoFiltrada   = opData ? opData.taxaRefugo  : (dados?.taxaRefugo     ?? 0);
  const taxaRetalhoFiltrada  = opData ? opData.taxaRetalho : (dados?.taxaRetalho    ?? 0);
  const eficienciaFiltrada   = opData ? opData.eficiencia  : (dados?.eficiencia     ?? 0);
  const indicePerdasFiltrado = producaoFiltrada > 0
    ? parseFloat(((refugoFiltrado + retalhoFiltrado) / producaoFiltrada * 100).toFixed(2)) : 0;
  const produtividadeFuncionario = numFuncionarios > 0
    ? parseFloat((producaoFiltrada / numFuncionarios).toFixed(2)) : 0;
// ─── Cálculo do OEE ───────────────────────────────────────────────
const HORAS_TURNO = 8;
const horasProducaoTotal = (dados?.totalRegistros ?? 0) * HORAS_TURNO;
const horasParadas       = dados?.horasParadasTotal ?? 0;

const oeeDisponibilidade = horasProducaoTotal > 0
  ? Math.min(((horasProducaoTotal - horasParadas) / horasProducaoTotal) * 100, 100)
  : 0;

const taxaProducaoMeta = metas?.metaProducaoHora ?? dados?.taxaProducao ?? 1;
const oeePerformance = taxaProducaoMeta > 0
  ? Math.min((dados?.taxaProducao ?? 0) / taxaProducaoMeta * 100, 100)
  : 100;

const producaoBoa = (dados?.producaoTotal ?? 0) - (dados?.refugoTotal ?? 0) - (dados?.retalhoTotal ?? 0);
const oeeQualidade = (dados?.producaoTotal ?? 0) > 0
  ? Math.min((producaoBoa / dados.producaoTotal) * 100, 100)
  : 0;

const oee = parseFloat(
  ((oeeDisponibilidade / 100) * (oeePerformance / 100) * (oeeQualidade / 100) * 100).toFixed(1)
);
// ──────────────────────────────────────────────────────────────────
  const turnoCardData = turnoCardSel
    ? (dados?.eficienciaPorTurno?.find(t => t.turno === turnoCardSel) || null)
    : null;
  const melhorTurno = dados?.eficienciaPorTurno?.length
    ? [...dados.eficienciaPorTurno].sort((a, b) => b.eficiencia - a.eficiencia)[0]
    : null;

  const inputSt = { background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 8,
    padding: "8px 12px", color: P.text, fontSize: 13, outline: "none", colorScheme: "dark" };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: P.bg, display: "flex", alignItems: "center",
      justifyContent: "center", flexDirection: "column", gap: 20 }}>
      <img src={logoHimaflex} alt="Himaflex" style={{ height: 48, opacity: 0.7 }} />
      <div style={{ width: 40, height: 40, border: `3px solid ${P.border}`,
        borderTop: `3px solid ${P.marcaC}`, borderRadius: "50%",
        animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: P.textM, fontSize: 14 }}>Carregando dashboard...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <ThemeProvider theme={muiTheme}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Faixa decorativa no topo */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${P.marca}, ${P.marcaC}, ${P.marcaL}, ${P.marcaC}, ${P.marca})`,
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }} />

      <div style={{ minHeight: "100vh", background: P.bg, padding: "32px 32px 40px",
        fontFamily: "'Inter', sans-serif", color: P.text, paddingTop: 36 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>

          {/* ── Cabeçalho ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            marginBottom: 28, flexWrap: "wrap", gap: 16 }}>

            {/* Logo + Título */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ background: `linear-gradient(135deg, ${P.marca}40, ${P.marcaC}20)`,
                border: `1px solid ${P.marcaC}30`, borderRadius: 14, padding: "8px 14px",
                display: "flex", alignItems: "center" }}>
                <img src={logoHimaflex} alt="Himaflex" style={{ height: 38, display: "block" }} />
              </div>
              <div style={{ width: 1, height: 48, background: P.border }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: P.verdeC,
                    boxShadow: `0 0 8px ${P.verdeC}` }} />
                  <span style={{ fontSize: 11, color: P.verdeC, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: 1.2 }}>Sistema Online</span>
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: P.text,
                  letterSpacing: -0.5 }}>Dashboard de Produção</h1>
                <p style={{ fontSize: 12, color: P.textM, margin: "3px 0 0" }}>
                  {setor || "Todos os setores"} · {turno ? `Turno ${turno}` : "Todos os turnos"} · {dataInicio} → {dataFim}
                </p>
              </div>
            </div>

            {/* Botões */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={() => setModalMetas(true)}
                style={{ background: P.bgCard, border: `1px solid ${P.border}`,
                  borderRadius: 10, padding: "10px 18px", color: P.text,
                  fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ⚙️ Metas
              </button>
              <button onClick={exportarPDF} disabled={exportando}
                style={{ background: `linear-gradient(135deg, ${P.marca}, ${P.marcaC})`,
                  border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  opacity: exportando ? 0.6 : 1,
                  boxShadow: `0 4px 14px ${P.marca}60` }}>
                {exportando ? "⏳ Exportando..." : "⬇ Exportar PDF"}
              </button>
            </div>
          </div>

          {/* ── Filtros ── */}
          <div style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 16,
            padding: "18px 24px", marginBottom: 24, display: "flex",
            flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
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
                <select value={f.v} onChange={e => f.s(e.target.value)}
                  style={{ ...inputSt, minWidth: 150 }}>
                  <option value="">Todos</option>
                  {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <button onClick={buscarDados}
              style={{ background: `linear-gradient(135deg, ${P.marca}, ${P.marcaC})`,
                border: "none", borderRadius: 8, padding: "9px 20px",
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Aplicar
            </button>
            {(setor || turno) && (
              <button onClick={() => { setSetor(""); setTurno(""); }}
                style={{ background: "transparent", border: `1px solid ${P.border}`,
                  borderRadius: 8, padding: "9px 14px", color: P.textM, fontSize: 13, cursor: "pointer" }}>
                ✕ Limpar
              </button>
            )}
            <button onClick={() => { setDataInicio(trintaDias); setDataFim(hoje); }}
              style={{ marginLeft: "auto", background: "transparent", border: "none",
                color: P.marcaL, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
              Últimos 30 dias
            </button>
          </div>

          {/* ── Barra de metas ── */}
          <div style={{ background: P.marca + "12", border: `1px solid ${P.marca}35`,
            borderRadius: 10, padding: "10px 18px", marginBottom: 20, fontSize: 12,
            color: P.textM, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ color: P.marcaL, fontWeight: 700 }}>📊 Metas:</span>
            {[{ l: "Refugo", v: metas.metaRefugo, u: "%" },
              { l: "Retalho", v: metas.metaRetalho, u: "%" },
              { l: "Perdas", v: metas.metaPerdas, u: "%" },
              { l: "Eficiência", v: metas.metaEficiencia, u: "%" }].map(m => (
              <span key={m.l}>
                <strong style={{ color: P.text }}>{m.l}:</strong>{" "}
                {m.v != null
                  ? <span style={{ color: P.amareloC }}>{m.v}{m.u}</span>
                  : <span style={{ color: P.border, fontStyle: "italic" }}>sem meta</span>}
              </span>
            ))}
            <span style={{ marginLeft: "auto", cursor: "pointer", color: P.marcaL, textDecoration: "underline" }}
              onClick={() => setModalMetas(true)}>Configurar →</span>
          </div>

          {erro && (
            <div style={{ background: "#dc262620", border: `1px solid ${P.vermelhoC}`,
              borderRadius: 10, padding: 16, marginBottom: 20, color: P.vermelhoC }}>{erro}</div>
          )}

          <div ref={dashRef}>
            {/* ── KPIs ── */}
            <Secao titulo="KPIs Principais" sub={filtroProduto ? `🔍 Filtrando por produto: ${filtroProduto} — clique ✕ no gráfico para limpar` : "Visão geral do período selecionado"}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
                {/* ── Card OEE ── */}
<div
  style={{
    background: P.bgCard,
    border: `1px solid ${oee >= 85 ? P.verdeC + "60" : oee >= 65 ? P.amareloC + "60" : P.vermelhoC + "60"}`,
    borderRadius: 16,
    padding: "20px 22px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 2px 8px #00000040",
    gridColumn: "span 1",
  }}
>
  {/* Barra colorida topo */}
  <div
    style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 3,
      background: `linear-gradient(90deg, ${oee >= 85 ? P.verdeC : oee >= 65 ? P.amareloC : P.vermelhoC}, ${P.marcaC})`,
      borderRadius: "16px 16px 0 0",
    }}
  />

  {/* Título + badge */}
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
    <p style={{ fontSize: 11, fontWeight: 600, color: P.textM, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
      OEE
    </p>
    <span style={{
      background: oee >= 85 ? P.verdeC + "25" : oee >= 65 ? P.amareloC + "25" : P.vermelhoC + "25",
      color:      oee >= 85 ? P.verdeC        : oee >= 65 ? P.amareloC        : P.vermelhoC,
      border: `1px solid ${oee >= 85 ? P.verdeC + "50" : oee >= 65 ? P.amareloC + "50" : P.vermelhoC + "50"}`,
      borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700,
    }}>
      {oee >= 85 ? "Ótimo" : oee >= 65 ? "Regular" : "Crítico"}
    </span>
  </div>

  {/* Valor principal */}
  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
    <p style={{ fontSize: 32, fontWeight: 800, color: oee >= 85 ? P.verdeC : oee >= 65 ? P.amareloC : P.vermelhoC, margin: 0, fontFamily: "monospace" }}>
      {oee.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
    </p>
    <span style={{ fontSize: 14, color: P.textM, fontWeight: 500 }}>%</span>
  </div>

  {/* Sub-indicadores */}
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 4 }}>
    {[
      { l: "Disp.", v: oeeDisponibilidade },
      { l: "Perf.", v: oeePerformance   },
      { l: "Qual.", v: oeeQualidade     },
    ].map(k => (
      <div key={k.l} style={{ background: "#0b0f1e", borderRadius: 8, padding: "5px 6px", border: `1px solid ${P.border}`, textAlign: "center" }}>
        <p style={{ fontSize: 9, color: P.textM, textTransform: "uppercase", letterSpacing: 0.6, margin: "0 0 2px" }}>{k.l}</p>
        <p style={{ fontSize: 13, fontWeight: 800, color: k.v >= 85 ? P.verdeC : k.v >= 65 ? P.amareloC : P.vermelhoC, margin: 0, fontFamily: "monospace" }}>
          {k.v.toFixed(1)}%
        </p>
      </div>
    ))}
  </div>

  <p style={{ fontSize: 11, color: P.textM, margin: "10px 0 0" }}>
    Disponibilidade × Performance × Qualidade
  </p>
</div>
                <KpiCard titulo={opData ? `Produção — ${operadorSel}` : "Produção Total"} unidade="kg" cor={P.marcaC}
                  valor={producaoFiltrada}
                  valorKg={opData ? null : (dados?.producaoTotalM ?? 0)}
                  descricao={opData ? `${opData.registros ?? "?"} registros` : "Volume total produzido"} />
                <KpiCard titulo={opData ? `Taxa Refugo — ${operadorSel}` : "Taxa de Refugo"} unidade="%"
                  cor={corPerda(taxaRefugoFiltrada, metas.metaRefugo)}
                  valor={taxaRefugoFiltrada} valorKg={refugoFiltrado}
                  meta={metas.metaRefugo}
                  alerta={metas.metaRefugo != null && taxaRefugoFiltrada > metas.metaRefugo ? "⚠ Acima da meta" : metas.metaRefugo != null ? "✓ Dentro da meta" : null}
                  badge={<Badge v={taxaRefugoFiltrada} metas={metas} tipo="refugo" />} />
                <KpiCard titulo={opData ? `Taxa Retalho — ${operadorSel}` : "Taxa de Retalho"} unidade="%"
                  cor={corPerda(taxaRetalhoFiltrada, metas.metaRetalho)}
                  valor={taxaRetalhoFiltrada} valorKg={retalhoFiltrado}
                  meta={metas.metaRetalho}
                  badge={<Badge v={taxaRetalhoFiltrada} metas={metas} tipo="retalho" />} />
                <KpiCard titulo={opData ? `Índice Perdas — ${operadorSel}` : "Índice de Perdas"} unidade="%"
                  cor={corPerda(indicePerdasFiltrado, metas.metaPerdas)}
                  valor={indicePerdasFiltrado} meta={metas.metaPerdas}
                  alerta={indicePerdasFiltrado > metas.metaPerdas ? "⚠ Alto desperdício" : null}
                  badge={<Badge v={indicePerdasFiltrado} metas={metas} tipo="perdas" />} />
                <KpiCard titulo={opData ? `Eficiência — ${operadorSel}` : "Eficiência"} unidade="%"
                  cor={corEfic(eficienciaFiltrada, metas.metaEficiencia)}
                  valor={eficienciaFiltrada} meta={metas.metaEficiencia}
                  badge={<Badge v={eficienciaFiltrada} metas={metas} tipo="efic" />} />
                <KpiCard titulo="Taxa de Produção" unidade="kg/h" cor={P.marcaL}
                  valor={dados?.taxaProducao ?? 0} descricao="Ritmo médio por hora" />

                {/* Card Tempo Médio de Parada */}
                <div style={{ background: P.bgCard,
                  border: `1px solid ${(dados?.tempoMedioParada ?? 0) > 2 ? P.vermelhoC + "60" : P.border}`,
                  borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden",
                  boxShadow: "0 2px 8px #00000040" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${(dados?.tempoMedioParada ?? 0) > 2 ? P.vermelhoC : P.cinza}, ${P.border})`,
                    borderRadius: "16px 16px 0 0" }} />
                  <p style={{ fontSize: 11, fontWeight: 600, color: P.textM,
                    textTransform: "uppercase", letterSpacing: 1, margin: "0 0 6px" }}>
                    ⏱ Tempo Médio de Parada
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: P.text, fontFamily: "monospace" }}>
                      {fmt(dados?.tempoMedioParada ?? 0)}
                    </span>
                    <span style={{ fontSize: 14, color: P.textM }}>h / registro</span>
                  </div>
                  {(dados?.tempoMedioParada ?? 0) > 2 && (
                    <p style={{ fontSize: 11, color: P.vermelhoC, fontWeight: 600, margin: "0 0 8px" }}>
                      ⚠ Acima de 2h
                    </p>
                  )}
                  {(dados?.top3Paradas?.length > 0) && (
                    <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 10, marginTop: 4 }}>
                      <p style={{ fontSize: 10, color: P.textM, textTransform: "uppercase",
                        letterSpacing: 0.8, margin: "0 0 8px", fontWeight: 600 }}>
                        Top 3 equipamentos parados
                      </p>
                      {dados.top3Paradas.map((m, i) => (
                        <div key={m.cod} style={{ display: "flex", justifyContent: "space-between",
                          alignItems: "center", marginBottom: 6, gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                            <span style={{ fontSize: 10, fontWeight: 800,
                              color: i === 0 ? P.vermelhoC : i === 1 ? P.amareloC : P.textM, minWidth: 16 }}>
                              {i + 1}º
                            </span>
                            <span style={{ fontSize: 11, color: P.text, whiteSpace: "nowrap",
                              overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                              {m.desc}
                            </span>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: P.text, fontFamily: "monospace" }}>
                              {fmt(m.horas)}h
                            </span>
                            <span style={{ fontSize: 10, color: P.textM, marginLeft: 4 }}>
                              ({m.ocorrencias}×)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {(!dados?.top3Paradas?.length) && (
                    <p style={{ fontSize: 11, color: P.textM, marginTop: 8 }}>
                      Nenhuma parada registrada no período.
                    </p>
                  )}
                </div>

                {/* Card Principal Motivo de Refugo */}
                <div style={{ background: P.bgCard, border: `1px solid ${P.border}`,
                  borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden",
                  boxShadow: "0 2px 8px #00000040" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${P.vermelhoC}, ${P.amareloC})`,
                    borderRadius: "16px 16px 0 0" }} />
                  <p style={{ fontSize: 11, fontWeight: 600, color: P.textM,
                    textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>
                    ⚠ Principal Motivo de Refugo
                  </p>
                  {dados?.principalMotivoRefugo ? (
                    <>
                      <p style={{ fontSize: 18, fontWeight: 800, color: P.vermelhoC,
                        margin: "0 0 6px", lineHeight: 1.3 }}>
                        {dados.principalMotivoRefugo.motivo}
                      </p>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ background: "#0b0f1e", borderRadius: 8,
                          padding: "6px 12px", border: `1px solid ${P.border}` }}>
                          <p style={{ fontSize: 10, color: P.textM, margin: "0 0 2px",
                            textTransform: "uppercase", letterSpacing: 0.7 }}>Ocorrências</p>
                          <p style={{ fontSize: 18, fontWeight: 800, color: P.text,
                            margin: 0, fontFamily: "monospace" }}>
                            {dados.principalMotivoRefugo.ocorrencias}×
                          </p>
                        </div>
                        <div style={{ background: "#0b0f1e", borderRadius: 8,
                          padding: "6px 12px", border: `1px solid ${P.border}` }}>
                          <p style={{ fontSize: 10, color: P.textM, margin: "0 0 2px",
                            textTransform: "uppercase", letterSpacing: 0.7 }}>Refugo gerado</p>
                          <p style={{ fontSize: 18, fontWeight: 800, color: P.vermelhoC,
                            margin: 0, fontFamily: "monospace" }}>
                            {fmt(dados.principalMotivoRefugo.totalKg)} kg
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: P.textM }}>Nenhum refugo registrado no período.</p>
                  )}
                </div>

                {/* Card Turnos */}
                <div style={{ background: P.bgCard, border: `1px solid ${P.border}`,
                  borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden",
                  boxShadow: "0 2px 8px #00000040", gridColumn: "span 2" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${P.verdeC}, ${P.marcaC})`,
                    borderRadius: "16px 16px 0 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: P.textM,
                      textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
                      🏆 Turnos
                    </p>
                    {turnoCardSel && (
                      <button onClick={() => setTurnoCardSel(null)}
                        style={{ fontSize: 11, color: P.textM, background: P.border,
                          border: "none", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>
                        Limpar
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                    {(dados?.eficienciaPorTurno || []).map(t => (
                      <button key={t.turno} onClick={() => setTurnoCardSel(prev => prev === t.turno ? null : t.turno)}
                        style={{ flex: 1, padding: "7px 4px", borderRadius: 8, cursor: "pointer",
                          fontSize: 12, fontWeight: 700,
                          border: `1px solid ${turnoCardSel === t.turno ? P.marcaC : P.border}`,
                          background: turnoCardSel === t.turno ? `${P.marcaC}25` : "#0b0f1e",
                          color: turnoCardSel === t.turno ? P.marcaL : P.textM,
                          transition: "all 0.15s" }}>
                        {t.turno}
                      </button>
                    ))}
                  </div>
                  {turnoCardData ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { l: "Produção", v: `${fmt(turnoCardData.producao)} kg`, c: P.marcaC },
                        { l: "Eficiência", v: `${turnoCardData.eficiencia}%`, c: corEfic(turnoCardData.eficiencia, metas.metaEficiencia) },
                        { l: "Refugo", v: `${turnoCardData.refugo} kg`, c: P.vermelhoC },
                        { l: "Registros", v: turnoCardData.registros, c: P.textM },
                      ].map(k => (
                        <div key={k.l} style={{ background: "#0b0f1e", borderRadius: 8,
                          padding: "8px 12px", border: `1px solid ${P.border}` }}>
                          <p style={{ fontSize: 10, color: P.textM, textTransform: "uppercase",
                            letterSpacing: 0.7, margin: "0 0 3px" }}>{k.l}</p>
                          <p style={{ fontSize: 16, fontWeight: 800, color: k.c,
                            margin: 0, fontFamily: "monospace" }}>{k.v}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      {melhorTurno && (
                        <div style={{ background: `${P.verdeC}15`, border: `1px solid ${P.verdeC}40`,
                          borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
                          <p style={{ fontSize: 10, color: P.verdeC, textTransform: "uppercase",
                            letterSpacing: 0.8, margin: "0 0 2px", fontWeight: 600 }}>
                            🏆 Mais eficiente
                          </p>
                          <p style={{ fontSize: 20, fontWeight: 800, color: P.verdeC,
                            margin: 0, fontFamily: "monospace" }}>
                            {melhorTurno.turno} — {melhorTurno.eficiencia}%
                          </p>
                        </div>
                      )}
                      <p style={{ fontSize: 11, color: P.textM, margin: 0 }}>
                        Selecione um turno para ver os detalhes.
                      </p>
                    </div>
                  )}
                </div>

                <KpiCard titulo="Registros no Período" unidade="" cor={P.cinza}
                  valor={dados?.totalRegistros ?? 0} descricao="Formulários lançados" />

                {/* Card Análise por Operador */}
                <div style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 16,
                  padding: "20px 22px", position: "relative", overflow: "hidden",
                  boxShadow: "0 2px 8px #00000030" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${P.verdeC}, ${P.marcaC})`,
                    borderRadius: "16px 16px 0 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: P.textM, textTransform: "uppercase",
                      letterSpacing: 1, margin: 0 }}>
                      👷 Análise por Operador
                    </p>
                    {operadorSel && (
                      <button onClick={() => setOperadorSel("")}
                        style={{ fontSize: 11, color: P.textM, background: P.border, border: "none",
                          borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>
                        ✕ Limpar
                      </button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 10, color: P.textM, display: "block", marginBottom: 4 }}>
                        {setor ? "Operador" : "Selecione um setor primeiro"}
                      </label>
                      <select value={operadorSel} onChange={e => setOperadorSel(e.target.value)}
                        disabled={!setor || operadores.length === 0}
                        style={{ width: "100%", background: "#0b0f1e", border: `1px solid ${P.border}`,
                          borderRadius: 6, padding: "6px 8px", color: setor ? P.text : P.textM,
                          fontSize: 12, outline: "none", colorScheme: "dark",
                          cursor: setor ? "pointer" : "not-allowed" }}>
                        <option value="">— Todos do setor —</option>
                        {operadores.map(o => <option key={o.id} value={o.usuario}>{o.usuario}</option>)}
                      </select>
                    </div>
                  </div>
                  {opData ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { l: "Produção", v: `${fmt(opData.producao)} kg`, c: P.marcaC },
                        { l: "Eficiência", v: `${opData.eficiencia}%`, c: corEfic(opData.eficiencia, metas.metaEficiencia) },
                        { l: "Refugo", v: `${opData.taxaRefugo}%`, c: corPerda(opData.taxaRefugo, metas.metaRefugo) },
                        { l: "Registros", v: opData.registros ?? 0, c: P.textM },
                      ].map(k => (
                        <div key={k.l} style={{ background: "#0b0f1e", borderRadius: 8,
                          padding: "8px 12px", border: `1px solid ${P.border}` }}>
                          <p style={{ fontSize: 10, color: P.textM, textTransform: "uppercase",
                            letterSpacing: 0.7, margin: "0 0 3px" }}>{k.l}</p>
                          <p style={{ fontSize: 16, fontWeight: 800, color: k.c,
                            margin: 0, fontFamily: "monospace" }}>{k.v}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 11, color: P.textM, margin: 0 }}>
                      Selecione um operador para ver os KPIs individuais — ou veja os totais do setor acima.
                    </p>
                  )}
                </div>
              </div>
            </Secao>

            {/* ── Tendência de Refugo e Retalho ── */}
            {tendDatas.length > 0 && (
              <Secao titulo="Tendência de Refugo e Retalho" sub={`Média refugo: ${mediaRefugo}% no período`}>
                <div style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 16, padding: 24 }}>
                  <ReactECharts
                    style={{ height: 320 }}
                    option={{
                      backgroundColor: "transparent",
                      tooltip: { trigger: "axis", backgroundColor: P.bgCardH, borderColor: P.border,
                        textStyle: { color: P.text, fontSize: 12 } },
                      legend: { data: ["Refugo %", "Retalho %"], textStyle: { color: P.textM }, top: 0 },
                      grid: { top: 40, bottom: 40, left: 50, right: 20 },
                      xAxis: { type: "category", data: tendDatas,
                        axisLabel: { color: P.textM, fontSize: 11 },
                        axisLine: { lineStyle: { color: P.border } } },
                      yAxis: { type: "value", axisLabel: { color: P.textM, formatter: "{value}%" },
                        splitLine: { lineStyle: { color: P.border + "60" } } },
                      series: [
                        { name: "Refugo %", type: "line", data: tendRefugo, smooth: true,
                          lineStyle: { color: P.vermelhoC, width: 2 },
                          itemStyle: { color: P.vermelhoC },
                          areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [{ offset: 0, color: P.vermelhoC + "30" }, { offset: 1, color: P.vermelhoC + "05" }] } } },
                        { name: "Retalho %", type: "line", data: tendRetalho, smooth: true,
                          lineStyle: { color: P.amareloC, width: 2 },
                          itemStyle: { color: P.amareloC },
                          areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [{ offset: 0, color: P.amareloC + "30" }, { offset: 1, color: P.amareloC + "05" }] } } },
                      ],
                    }}
                  />
                </div>
              </Secao>
            )}

            {/* ── Top 10 Produtos ── */}
            {top10.length > 0 && (
              <Secao titulo="Top 10 Produtos por Produção" sub="Clique em uma barra para filtrar os KPIs acima">
                <div style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 16, padding: 24 }}>
                  {filtroProduto && (
                    <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, color: P.marcaL }}>
                        🔍 Filtrado: <strong>{filtroProduto}</strong>
                      </span>
                      <button onClick={() => setFiltroProduto(null)}
                        style={{ background: P.border, border: "none", borderRadius: 6,
                          padding: "2px 10px", color: P.textM, fontSize: 11, cursor: "pointer" }}>
                        ✕ Limpar
                      </button>
                    </div>
                  )}
                  <ReactECharts
                    style={{ height: 340 }}
                    onEvents={{ click: (p) => setFiltroProduto(prev => prev === p.name ? null : p.name) }}
                    option={{
                      backgroundColor: "transparent",
                      tooltip: { trigger: "axis", backgroundColor: P.bgCardH, borderColor: P.border,
                        textStyle: { color: P.text, fontSize: 12 },
                        formatter: (params) => `${params[0].name}<br/>Produção: ${fmt(params[0].value)} kg` },
                      grid: { top: 20, bottom: 80, left: 60, right: 20 },
                      xAxis: { type: "category",
                        data: top10.map(p => p.produto?.length > 18 ? p.produto.slice(0, 18) + "…" : p.produto),
                        axisLabel: { color: P.textM, fontSize: 10, rotate: 30 },
                        axisLine: { lineStyle: { color: P.border } } },
                      yAxis: { type: "value", axisLabel: { color: P.textM, formatter: v => `${(v/1000).toFixed(1)}t` },
                        splitLine: { lineStyle: { color: P.border + "60" } } },
                      series: [{
                        type: "bar", data: top10.map(p => p.prodKg), barMaxWidth: 48,
                        itemStyle: {
                          color: (params) => {
                            const item = top10[params.dataIndex];
                            return filtroProduto === item.produto ? P.verdeC : {
                              type: "linear", x: 0, y: 0, x2: 0, y2: 1,
                              colorStops: [{ offset: 0, color: P.marcaC }, { offset: 1, color: P.marcaL + "80" }]
                            };
                          },
                          borderRadius: [6, 6, 0, 0],
                        },
                        label: { show: true, position: "top", color: P.textM, fontSize: 10,
                          formatter: p => `${(p.value / 1000).toFixed(1)}t` },
                      }],
                    }}
                  />
                </div>
              </Secao>
            )}

            {/* ── Refugo por Produto ── */}
            {(dados?.refugoPorProduto?.length > 0) && (
              <Secao titulo="Refugo por Produto" sub="Produtos com maior índice de refugo">
                <div style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderRadius: 16, padding: 24 }}>
                  <ReactECharts
                    style={{ height: 300 }}
                    option={{
                      backgroundColor: "transparent",
                      tooltip: { trigger: "axis", backgroundColor: P.bgCardH, borderColor: P.border,
                        textStyle: { color: P.text, fontSize: 12 } },
                      grid: { top: 20, bottom: 80, left: 60, right: 20 },
                      xAxis: { type: "category",
                        data: dados.refugoPorProduto.slice(0, 10).map(p => p.produto?.length > 18 ? p.produto.slice(0, 18) + "…" : p.produto),
                        axisLabel: { color: P.textM, fontSize: 10, rotate: 30 },
                        axisLine: { lineStyle: { color: P.border } } },
                      yAxis: { type: "value", axisLabel: { color: P.textM, formatter: "{value} kg" },
                        splitLine: { lineStyle: { color: P.border + "60" } } },
                      series: [{
                        type: "bar", data: dados.refugoPorProduto.slice(0, 10).map(p => p.refugoKg),
                        barMaxWidth: 48,
                        itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1,
                          colorStops: [{ offset: 0, color: P.vermelhoC }, { offset: 1, color: P.amareloC + "80" }] },
                          borderRadius: [6, 6, 0, 0] },
                        label: { show: true, position: "top", color: P.textM, fontSize: 10,
                          formatter: p => `${fmt(p.value, 0)}kg` },
                      }],
                    }}
                  />
                </div>
              </Secao>
            )}

            {/* ── Produção por Operador ── */}
            {(dados?.producaoPorOperador?.length > 0) && (
              <Secao titulo="Produção por Operador" sub="Comparativo entre colaboradores">
                <Tabela
                  dados={dados.producaoPorOperador}
                  chave="usuario"
                  colunas={[
                    { key: "usuario", label: "Operador" },
                    { key: "producao", label: "Produção (kg)", align: "right", render: v => fmt(v, 0) },
                    { key: "taxaRefugo", label: "Refugo %", align: "right",
                      render: (v) => (
                        <span style={{ color: corPerda(v, metas.metaRefugo), fontWeight: 700 }}>{fmt(v)}%</span>
                      ) },
                    { key: "eficiencia", label: "Eficiência %", align: "right",
                      render: (v) => (
                        <span style={{ color: corEfic(v, metas.metaEficiencia), fontWeight: 700 }}>{fmt(v)}%</span>
                      ) },
                    { key: "registros", label: "Registros", align: "right" },
                  ]}
                />
              </Secao>
            )}

            {/* ── Sumário ── */}
            {dados && (
              <Secao titulo="Resumo do Período">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  {[
                    { l: "Produção Total", v: `${fmt(dados.producaoTotal, 0)} kg`, c: P.marcaC },
                    { l: "Total Refugo", v: `${fmt(dados.refugoTotal, 0)} kg`, c: P.vermelhoC },
                    { l: "Total Retalho", v: `${fmt(dados.retalhoTotal, 0)} kg`, c: P.amareloC },
                    { l: "Eficiência Média", v: `${fmt(dados.eficiencia)}%`, c: corEfic(dados.eficiencia, metas.metaEficiencia) },
                    { l: "Taxa de Refugo", v: `${fmt(dados.taxaRefugo)}%`, c: corPerda(dados.taxaRefugo, metas.metaRefugo) },
                    { l: "Total Registros", v: dados.totalRegistros, c: P.cinza },
                  ].map(s => (
                    <div key={s.l} style={{ background: P.bgCard, border: `1px solid ${P.border}`,
                      borderRadius: 12, padding: "14px 18px" }}>
                      <p style={{ fontSize: 10, color: P.textM, textTransform: "uppercase",
                        letterSpacing: 0.8, margin: "0 0 6px", fontWeight: 600 }}>{s.l}</p>
                      <p style={{ fontSize: 20, fontWeight: 800, color: s.c, margin: 0, fontFamily: "monospace" }}>{s.v}</p>
                    </div>
                  ))}
                </div>
              </Secao>
            )}

            {!dados && !loading && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: P.textM }}>
                <p style={{ fontSize: 18, marginBottom: 8 }}>Nenhum registro encontrado</p>
                <p style={{ fontSize: 13 }}>Ajuste o período ou os filtros.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalMetas && (
        <ModalMetas metas={metas} onSalvar={salvarMetas} onFechar={() => setModalMetas(false)} />
      )}
    </ThemeProvider>
  );
}
