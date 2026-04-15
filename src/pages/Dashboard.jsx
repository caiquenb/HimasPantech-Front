// src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";

const API_URL = import.meta.env.VITE_API_URL;

// ── Tema MUI customizado ──────────────────────────────────────────────────────
const muiTheme = createTheme({
  palette: { mode: "light" },
  typography: { fontFamily: "'DM Sans', sans-serif" },
});

// ── Paleta de cores do dashboard ──────────────────────────────────────────────
const PALETTE = {
  azul:      "#1d4ed8",
  azulClaro: "#3b82f6",
  verde:     "#059669",
  verdeClaro:"#10b981",
  amarelo:   "#d97706",
  amareloClaro:"#f59e0b",
  vermelho:  "#dc2626",
  vermelhoClaro:"#ef4444",
  roxo:      "#7c3aed",
  cinza:     "#64748b",
  bg:        "#0f172a",
  bgCard:    "#1e293b",
  bgCardHover:"#263548",
  border:    "#334155",
  text:      "#f1f5f9",
  textMuted: "#94a3b8",
};

// ── Utilitários ───────────────────────────────────────────────────────────────
const fmt = (v, dec = 2) =>
  typeof v === "number" ? v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : "—";

const corEficiencia = (v) => (v >= 90 ? PALETTE.verde : v >= 75 ? PALETTE.amarelo : PALETTE.vermelho);
const corPerda      = (v) => (v <= 2  ? PALETTE.verde : v <= 5  ? PALETTE.amarelo : PALETTE.vermelho);
const bgEficiencia  = (v) => (v >= 90 ? "#05966920" : v >= 75 ? "#d9770620" : "#dc262620");

// ── Componente: Badge de status ───────────────────────────────────────────────
function StatusBadge({ value, thresholds, labels, invert = false }) {
  let color, label;
  if (invert) {
    color = value <= thresholds[0] ? PALETTE.verde : value <= thresholds[1] ? PALETTE.amarelo : PALETTE.vermelho;
    label = value <= thresholds[0] ? labels[0] : value <= thresholds[1] ? labels[1] : labels[2];
  } else {
    color = value >= thresholds[0] ? PALETTE.verde : value >= thresholds[1] ? PALETTE.amarelo : PALETTE.vermelho;
    label = value >= thresholds[0] ? labels[0] : value >= thresholds[1] ? labels[1] : labels[2];
  }
  return (
    <span style={{ background: color + "25", color, border: `1px solid ${color}50`,
      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
      {label}
    </span>
  );
}

// ── Componente: KPI Card ──────────────────────────────────────────────────────
function KpiCard({ titulo, valor, unidade, valorKg, descricao, cor, alerta, badge, sparkData, onClick, ativo }) {
  const [hovered, setHovered] = useState(false);

  const mostrarKg = valorKg !== undefined && hovered;

  return (
    <Tooltip title={valorKg !== undefined ? `${fmt(valorKg)} kg` : ""} placement="top" arrow>
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: ativo ? PALETTE.bgCardHover : PALETTE.bgCard,
          border: `1px solid ${ativo ? cor : PALETTE.border}`,
          borderRadius: 16,
          padding: "20px 22px",
          cursor: onClick ? "pointer" : "default",
          transition: "all 0.2s ease",
          position: "relative",
          overflow: "hidden",
          boxShadow: ativo ? `0 0 0 2px ${cor}40, 0 8px 32px ${cor}20` : "0 2px 8px #00000030",
          transform: hovered ? "translateY(-2px)" : "none",
        }}
      >
        {/* Barra colorida no topo */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${cor}, ${cor}80)`, borderRadius: "16px 16px 0 0" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: PALETTE.textMuted, textTransform: "uppercase",
            letterSpacing: 1, margin: 0 }}>{titulo}</p>
          {badge}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <p style={{ fontSize: 32, fontWeight: 800, color: mostrarKg ? PALETTE.textMuted : PALETTE.text,
            margin: 0, transition: "color 0.2s", fontFamily: "'DM Mono', monospace" }}>
            {mostrarKg ? fmt(valorKg) : (typeof valor === "number" ? fmt(valor) : valor)}
          </p>
          <span style={{ fontSize: 14, color: PALETTE.textMuted, fontWeight: 500 }}>
            {mostrarKg ? "kg" : unidade}
          </span>
        </div>

        {valorKg !== undefined && (
          <p style={{ fontSize: 10, color: PALETTE.textMuted, margin: "4px 0 0", opacity: hovered ? 0 : 1,
            transition: "opacity 0.2s" }}>
            passe o mouse para ver em kg
          </p>
        )}

        {descricao && !valorKg && (
          <p style={{ fontSize: 11, color: PALETTE.textMuted, margin: "6px 0 0" }}>{descricao}</p>
        )}

        {alerta && (
          <p style={{ fontSize: 11, color: cor, margin: "6px 0 0", fontWeight: 600 }}>{alerta}</p>
        )}

        {/* Mini sparkline no canto */}
        {sparkData && sparkData.length > 1 && (
          <svg width="80" height="30" style={{ position: "absolute", bottom: 12, right: 16, opacity: 0.4 }}>
            {sparkData.map((v, i) => {
              const min = Math.min(...sparkData);
              const max = Math.max(...sparkData);
              const range = max - min || 1;
              const x = (i / (sparkData.length - 1)) * 76 + 2;
              const y = 28 - ((v - min) / range) * 24;
              return i === 0 ? null : (
                <line key={i}
                  x1={(((i-1) / (sparkData.length - 1)) * 76) + 2}
                  y1={28 - ((sparkData[i-1] - min) / range) * 24}
                  x2={x} y2={y}
                  stroke={cor} strokeWidth={1.5} strokeLinecap="round" />
              );
            })}
          </svg>
        )}
      </div>
    </Tooltip>
  );
}

// ── Componente: Seção ─────────────────────────────────────────────────────────
function Secao({ titulo, subtitulo, children, id }) {
  return (
    <div style={{ marginBottom: 40 }} id={id}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: PALETTE.text, margin: 0 }}>{titulo}</h3>
        {subtitulo && <p style={{ fontSize: 13, color: PALETTE.textMuted, margin: "4px 0 0" }}>{subtitulo}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Componente: Tabela analítica ──────────────────────────────────────────────
function TabelaAnalitica({ dados, colunas, chave, selecionado, onSelecionar, corColuna }) {
  return (
    <div style={{ background: PALETTE.bgCard, borderRadius: 16, border: `1px solid ${PALETTE.border}`,
      overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#0f172a" }}>
            {colunas.map((c) => (
              <th key={c.key} style={{ padding: "12px 16px", textAlign: c.align || "left",
                color: PALETTE.textMuted, fontWeight: 600, fontSize: 11,
                textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados.map((row, i) => (
            <tr key={row[chave]}
              onClick={() => onSelecionar?.(selecionado === row[chave] ? null : row[chave])}
              style={{
                background: selecionado === row[chave] ? "#1d4ed820" : i % 2 === 0 ? PALETTE.bgCard : "#172033",
                borderLeft: selecionado === row[chave] ? `3px solid ${PALETTE.azul}` : "3px solid transparent",
                cursor: onSelecionar ? "pointer" : "default",
                transition: "background 0.15s",
              }}>
              {colunas.map((c) => (
                <td key={c.key} style={{ padding: "11px 16px", color: PALETTE.text,
                  textAlign: c.align || "left", borderBottom: `1px solid ${PALETTE.border}20` }}>
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

// ── Componente: Card de motivo ────────────────────────────────────────────────
function MotivoCard({ motivo, quantidade, kg, percentual, cor, rank }) {
  return (
    <div style={{ background: PALETTE.bgCard, border: `1px solid ${PALETTE.border}`,
      borderRadius: 12, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
      {/* Barra de fundo proporcional */}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0,
        width: `${percentual}%`, background: cor + "12", transition: "width 0.5s ease" }} />

      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 14 }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: cor, minWidth: 28,
          fontFamily: "'DM Mono', monospace" }}>#{rank}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: PALETTE.text,
            lineHeight: 1.4 }}>{motivo}</p>
          <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
            <span style={{ fontSize: 12, color: PALETTE.textMuted }}>
              <strong style={{ color: cor }}>{quantidade}x</strong> ocorrências
            </span>
            {kg > 0 && (
              <span style={{ fontSize: 12, color: PALETTE.textMuted }}>
                <strong style={{ color: PALETTE.text }}>{fmt(kg)} kg</strong> perdidos
              </span>
            )}
          </div>
          {/* Barra de progresso */}
          <div style={{ marginTop: 8, height: 4, background: PALETTE.border,
            borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${percentual}%`, background: cor,
              borderRadius: 4, transition: "width 0.6s ease" }} />
          </div>
        </div>
        <span style={{ fontSize: 18, fontWeight: 800, color: PALETTE.textMuted,
          fontFamily: "'DM Mono', monospace" }}>{percentual.toFixed(0)}%</span>
      </div>
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────────────────────
export default function Dashboard() {
  const dashboardRef = useRef(null);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [exportando, setExportando] = useState(false);

  const hoje = new Date().toISOString().split("T")[0];
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [dataInicio, setDataInicio] = useState(trintaDiasAtras);
  const [dataFim, setDataFim]       = useState(hoje);
  const [setor, setSetor]           = useState("");
  const [turno, setTurno]           = useState("");
  const [turnoSelecionado, setTurnoSelecionado] = useState(null);
  const [linhaSelecionada, setLinhaSelecionada] = useState(null);

  const buscarDados = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const params = { dataInicio, dataFim };
      if (setor) params.setor = setor;
      if (turno) params.turno = turno;
      const res = await axios.get(`${API_URL}/api/dashboard`, { params });
      if (res.data.success) setDados(res.data.data);
    } catch {
      setErro("Erro ao carregar dados.");
    } finally {
      setCarregando(false);
    }
  }, [dataInicio, dataFim, setor, turno]);

  useEffect(() => { buscarDados(); }, []);

  // ── Exportar PDF ────────────────────────────────────────────────────────────
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"), import("jspdf"),
      ]);
      const canvas = await html2canvas(dashboardRef.current, { scale: 1.5, backgroundColor: PALETTE.bg });
      const pdf = new jsPDF({ orientation: "landscape", unit: "px",
        format: [canvas.width, canvas.height] });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`dashboard-${hoje}.pdf`);
    } catch { alert("Erro ao exportar."); }
    finally { setExportando(false); }
  };

  // ── Processar motivos de refugo, retalho e parada ─────────────────────────
  const processarMotivos = (registros, campo, campoPeso = null) => {
    const mapa = {};
    registros?.forEach((r) => {
      const motivo = r[campo];
      if (!motivo) return;
      if (!mapa[motivo]) mapa[motivo] = { motivo, quantidade: 0, kg: 0 };
      mapa[motivo].quantidade += 1;
      if (campoPeso && r[campoPeso]) mapa[motivo].kg += parseFloat(r[campoPeso]) || 0;
    });
    const lista = Object.values(mapa).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);
    const maxQ = lista[0]?.quantidade || 1;
    return lista.map((m) => ({ ...m, percentual: (m.quantidade / maxQ) * 100 }));
  };

  // ── Top 10 mangueiras mais fabricadas ─────────────────────────────────────
  const top10Mangueiras = (() => {
    if (!dados?.registrosRaw) return [];
    const mapa = {};
    dados.registrosRaw.forEach((r) => {
      const key = r.produto || r.codProducao;
      if (!key) return;
      if (!mapa[key]) mapa[key] = { produto: key, prodKg: 0, prodM: 0, registros: 0 };
      mapa[key].prodKg += parseFloat(r.prodKg) || 0;
      mapa[key].prodM  += parseFloat(r.prodM)  || 0;
      mapa[key].registros += 1;
    });
    return Object.values(mapa)
      .sort((a, b) => b.prodKg - a.prodKg)
      .slice(0, 10)
      .map((m) => ({ ...m, prodKg: parseFloat(m.prodKg.toFixed(2)) }));
  })();

  // ── Dados para gráfico de área (tendência refugo) ─────────────────────────
  const tendenciaDatas   = dados?.tendenciaRefugo?.map((r) => r.data) || [];
  const tendenciaRefugo  = dados?.tendenciaRefugo?.map((r) => r.taxaRefugo) || [];
  const tendenciaRetalho = dados?.tendenciaRefugo?.map((r) => r.taxaRetalho) || [];

  const mediaRefugo = tendenciaRefugo.length
    ? (tendenciaRefugo.reduce((a, b) => a + b, 0) / tendenciaRefugo.length).toFixed(2)
    : 0;

  // ── Cores dos turnos no gráfico ────────────────────────────────────────────
  const coresTurnos = [PALETTE.azulClaro, PALETTE.amareloClaro, PALETTE.roxo,
    PALETTE.verdeClaro, PALETTE.vermelhoClaro];

  const dadosTurno   = dados?.eficienciaPorTurno || [];
  const dadosLinha   = dados?.eficienciaPorLinha || [];
  const turnosFiltrados = turnoSelecionado ? dadosTurno.filter(t => t.turno === turnoSelecionado) : dadosTurno;
  const linhasFiltradas = linhaSelecionada ? dadosLinha.filter(l => l.linha === linhaSelecionada) : dadosLinha;

  const kpiTurno = turnoSelecionado ? dadosTurno.find(t => t.turno === turnoSelecionado) : null;

  const inputStyle = {
    background: PALETTE.bgCard, border: `1px solid ${PALETTE.border}`,
    borderRadius: 8, padding: "8px 12px", color: PALETTE.text,
    fontSize: 13, outline: "none", colorScheme: "dark",
  };

  const selecaoAtiva = turnoSelecionado || linhaSelecionada;

  if (carregando) return (
    <div style={{ minHeight: "100vh", background: PALETTE.bg, display: "flex",
      alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 48, height: 48, border: `3px solid ${PALETTE.border}`,
        borderTop: `3px solid ${PALETTE.azulClaro}`, borderRadius: "50%",
        animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: PALETTE.textMuted, fontSize: 14 }}>Carregando dashboard...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <ThemeProvider theme={muiTheme}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <div style={{ minHeight: "100vh", background: PALETTE.bg, padding: "28px 32px",
        fontFamily: "'DM Sans', sans-serif", color: PALETTE.text }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>

          {/* ── Cabeçalho ─────────────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: PALETTE.verdeClaro,
                  boxShadow: `0 0 8px ${PALETTE.verdeClaro}` }} />
                <span style={{ fontSize: 12, color: PALETTE.verdeClaro, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: 1 }}>Live Dashboard</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: PALETTE.text }}>
                Produção Himaflex
              </h1>
              <p style={{ fontSize: 13, color: PALETTE.textMuted, margin: "4px 0 0" }}>
                {setor || "Todos os setores"} · {turno ? `Turno ${turno}` : "Todos os turnos"} ·{" "}
                {dataInicio} → {dataFim}
              </p>
            </div>
            <button onClick={exportarPDF} disabled={exportando}
              style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex",
                alignItems: "center", gap: 8, opacity: exportando ? 0.6 : 1 }}>
              {exportando ? "⏳ Exportando..." : "⬇ Exportar PDF"}
            </button>
          </div>

          {/* ── Filtros ───────────────────────────────────────────────── */}
          <div style={{ background: PALETTE.bgCard, border: `1px solid ${PALETTE.border}`,
            borderRadius: 16, padding: "18px 24px", marginBottom: 32,
            display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
            {[
              { label: "Data início", type: "date", value: dataInicio, onChange: setDataInicio },
              { label: "Data fim",    type: "date", value: dataFim,    onChange: setDataFim },
            ].map((f) => (
              <div key={f.label}>
                <label style={{ display: "block", fontSize: 11, color: PALETTE.textMuted,
                  marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  {f.label}
                </label>
                <input type={f.type} value={f.value} onChange={(e) => f.onChange(e.target.value)}
                  style={inputStyle} />
              </div>
            ))}
            {[
              { label: "Setor", value: setor, onChange: setSetor, options: dados?.setoresDisponiveis || [] },
              { label: "Turno", value: turno, onChange: setTurno, options: dados?.turnosDisponiveis || [] },
            ].map((f) => (
              <div key={f.label}>
                <label style={{ display: "block", fontSize: 11, color: PALETTE.textMuted,
                  marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  {f.label}
                </label>
                <select value={f.value} onChange={(e) => f.onChange(e.target.value)} style={{ ...inputStyle, minWidth: 150 }}>
                  <option value="">Todos</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <button onClick={buscarDados}
              style={{ background: PALETTE.azul, border: "none", borderRadius: 8,
                padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Aplicar
            </button>
            {(setor || turno) && (
              <button onClick={() => { setSetor(""); setTurno(""); }}
                style={{ background: "transparent", border: `1px solid ${PALETTE.border}`,
                  borderRadius: 8, padding: "9px 14px", color: PALETTE.textMuted,
                  fontSize: 13, cursor: "pointer" }}>
                ✕ Limpar
              </button>
            )}
            <button onClick={() => { setDataInicio(trintaDiasAtras); setDataFim(hoje); }}
              style={{ marginLeft: "auto", background: "transparent", border: "none",
                color: PALETTE.textMuted, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
              Últimos 30 dias
            </button>
          </div>

          {/* Aviso de seleção ativa */}
          {selecaoAtiva && (
            <div style={{ background: "#1d4ed815", border: `1px solid ${PALETTE.azul}40`,
              borderRadius: 10, padding: "10px 18px", marginBottom: 24,
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: PALETTE.azulClaro }}>
                🔍 Filtrando por: <strong>{turnoSelecionado ? `Turno ${turnoSelecionado}` : `Linha ${linhaSelecionada}`}</strong>
                {" "}— clique novamente para deselecionar
              </span>
              <button onClick={() => { setTurnoSelecionado(null); setLinhaSelecionada(null); }}
                style={{ background: "transparent", border: "none", color: PALETTE.azulClaro,
                  fontSize: 13, cursor: "pointer", fontWeight: 700 }}>
                ✕ Limpar seleção
              </button>
            </div>
          )}

          {erro && (
            <div style={{ background: "#dc262620", border: `1px solid ${PALETTE.vermelho}`,
              borderRadius: 10, padding: 16, marginBottom: 24, color: PALETTE.vermelhoClaro }}>
              {erro}
            </div>
          )}

          {/* ── Conteúdo exportável ───────────────────────────────────── */}
          <div ref={dashboardRef}>

            {/* ── KPIs principais ────────────────────────────────────── */}
            <Secao titulo="KPIs Principais" subtitulo={
              kpiTurno ? `Exibindo dados do Turno ${turnoSelecionado}` : "Visão geral do período selecionado"
            }>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                <KpiCard titulo="Produção Total" unidade="kg" cor={PALETTE.azulClaro}
                  valor={(kpiTurno ? kpiTurno.producao : dados?.producaoTotal) ?? 0}
                  descricao="Volume total produzido"
                  sparkData={tendenciaRefugo.map((_, i) => dados?.tendenciaRefugo?.[i]?.producaoKg || 0)} />

                <KpiCard titulo="Taxa de Refugo" unidade="%" cor={corPerda(dados?.taxaRefugo || 0)}
                  valor={dados?.taxaRefugo ?? 0}
                  valorKg={kpiTurno ? kpiTurno.refugo : dados?.refugoTotal}
                  alerta={dados?.taxaRefugo > 5 ? "⚠ Acima do limite" : "✓ Dentro do limite"}
                  badge={<StatusBadge value={dados?.taxaRefugo || 0} thresholds={[2, 5]}
                    labels={["Ótimo", "Atenção", "Crítico"]} invert />} />

                <KpiCard titulo="Taxa de Retalho" unidade="%" cor={corPerda(dados?.taxaRetalho || 0)}
                  valor={dados?.taxaRetalho ?? 0}
                  valorKg={kpiTurno ? kpiTurno.retalho : dados?.retalhoTotal}
                  badge={<StatusBadge value={dados?.taxaRetalho || 0} thresholds={[2, 5]}
                    labels={["Ótimo", "Atenção", "Crítico"]} invert />} />

                <KpiCard titulo="Índice de Perdas" unidade="%" cor={corPerda(dados?.indicePerdas || 0)}
                  valor={dados?.indicePerdas ?? 0}
                  descricao="(Refugo + Retalho) / Produção"
                  alerta={dados?.indicePerdas > 8 ? "⚠ Alto desperdício" : null}
                  badge={<StatusBadge value={dados?.indicePerdas || 0} thresholds={[4, 8]}
                    labels={["Ótimo", "Atenção", "Crítico"]} invert />} />

                <KpiCard titulo="Eficiência da Produção" unidade="%" cor={corEficiencia(kpiTurno?.eficiencia || dados?.eficiencia || 0)}
                  valor={kpiTurno ? kpiTurno.eficiencia : dados?.eficiencia ?? 0}
                  descricao="(Produção − Refugo) / Produção"
                  badge={<StatusBadge value={kpiTurno?.eficiencia || dados?.eficiencia || 0}
                    thresholds={[90, 75]} labels={["Ótimo", "Regular", "Baixo"]} />} />

                <KpiCard titulo="Taxa de Produção" unidade="kg/h" cor={PALETTE.roxo}
                  valor={kpiTurno ? kpiTurno.produtividade : dados?.taxaProducao ?? 0}
                  descricao="Ritmo médio por hora de turno" />

                <KpiCard titulo="Tempo Médio de Parada" unidade="h"
                  cor={dados?.tempoMedioParada > 2 ? PALETTE.vermelho : PALETTE.cinza}
                  valor={dados?.tempoMedioParada ?? 0}
                  descricao="Média de horas paradas por turno"
                  alerta={dados?.tempoMedioParada > 2 ? "⚠ Acima de 2h" : null} />

                <KpiCard titulo="Registros no Período" unidade="" cor={PALETTE.cinza}
                  valor={dados?.totalRegistros ?? 0}
                  descricao="Formulários lançados" />
              </div>
            </Secao>

            {/* ── Top 10 Mangueiras ─────────────────────────────────── */}
            {top10Mangueiras.length > 0 && (
              <Secao titulo="Top 10 Produtos Fabricados"
                subtitulo="Ranking por kg produzidos no período — clique em uma barra para detalhes">
                <div style={{ background: PALETTE.bgCard, border: `1px solid ${PALETTE.border}`,
                  borderRadius: 16, padding: "24px 20px" }}>
                  <BarChart
                    dataset={top10Mangueiras}
                    series={[{
                      dataKey: "prodKg",
                      label: "Produção (kg)",
                      valueFormatter: (v) => `${fmt(v)} kg`,
                      color: PALETTE.azulClaro,
                    }]}
                    layout="horizontal"
                    height={Math.max(280, top10Mangueiras.length * 42)}
                    xAxis={[{
                      label: "kg produzidos",
                      tickLabelStyle: { fill: PALETTE.textMuted, fontSize: 11 },
                    }]}
                    yAxis={[{
                      scaleType: "band",
                      dataKey: "produto",
                      width: 200,
                      tickLabelStyle: { fill: PALETTE.text, fontSize: 12, fontWeight: 600 },
                    }]}
                    sx={{
                      "& .MuiChartsAxis-line": { stroke: PALETTE.border },
                      "& .MuiChartsAxis-tick": { stroke: PALETTE.border },
                      "& .MuiChartsGrid-line": { stroke: PALETTE.border, opacity: 0.3 },
                      "& .MuiChartsLegend-mark": { rx: 4 },
                      backgroundColor: "transparent",
                    }}
                    grid={{ vertical: true }}
                    margin={{ left: 210, right: 40, top: 10, bottom: 40 }}
                  />
                </div>
              </Secao>
            )}

            {/* ── Tendência de Refugo (Área com gradiente) ──────────── */}
            {tendenciaDatas.length > 1 && (
              <Secao titulo="Tendência de Refugo & Retalho"
                subtitulo={`Média do período: ${mediaRefugo}% — acompanhe se o refugo está subindo ou caindo`}>
                <div style={{ background: PALETTE.bgCard, border: `1px solid ${PALETTE.border}`,
                  borderRadius: 16, padding: "24px 20px" }}>
                  <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
                    {[
                      { label: "Média Refugo", valor: `${mediaRefugo}%`, cor: PALETTE.vermelhoClaro },
                      { label: "Última taxa", valor: `${tendenciaRefugo[tendenciaRefugo.length - 1] ?? 0}%`,
                        cor: corPerda(tendenciaRefugo[tendenciaRefugo.length - 1] || 0) },
                      { label: "Tendência", cor: PALETTE.textMuted,
                        valor: tendenciaRefugo.length > 2
                          ? tendenciaRefugo[tendenciaRefugo.length - 1] > tendenciaRefugo[tendenciaRefugo.length - 2]
                            ? "📈 Subindo" : "📉 Caindo"
                          : "—" },
                    ].map((s) => (
                      <div key={s.label} style={{ background: "#0f172a", borderRadius: 10,
                        padding: "10px 16px", border: `1px solid ${PALETTE.border}` }}>
                        <p style={{ margin: 0, fontSize: 11, color: PALETTE.textMuted,
                          textTransform: "uppercase", letterSpacing: 0.8 }}>{s.label}</p>
                        <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700,
                          color: s.cor, fontFamily: "'DM Mono', monospace" }}>{s.valor}</p>
                      </div>
                    ))}
                  </div>

                  <LineChart
                    xAxis={[{ data: tendenciaDatas, scaleType: "point",
                      tickLabelStyle: { fill: PALETTE.textMuted, fontSize: 11 } }]}
                    yAxis={[{ tickLabelStyle: { fill: PALETTE.textMuted, fontSize: 11 },
                      valueFormatter: (v) => `${v}%` }]}
                    series={[
                      { data: tendenciaRefugo, label: "Taxa de Refugo (%)", color: PALETTE.vermelhoClaro,
                        area: true, showMark: true, valueFormatter: (v) => `${v}%`,
                        curve: "monotoneX" },
                      { data: tendenciaRetalho, label: "Taxa de Retalho (%)", color: PALETTE.amareloClaro,
                        area: true, showMark: false, valueFormatter: (v) => `${v}%`,
                        curve: "monotoneX" },
                    ]}
                    height={280}
                    sx={{
                      "& .MuiChartsAxis-line":    { stroke: PALETTE.border },
                      "& .MuiChartsAxis-tick":    { stroke: PALETTE.border },
                      "& .MuiChartsGrid-line":    { stroke: PALETTE.border, opacity: 0.3 },
                      "& .MuiAreaElement-series-0": { fill: `${PALETTE.vermelhoClaro}20` },
                      "& .MuiAreaElement-series-1": { fill: `${PALETTE.amareloClaro}15` },
                    }}
                    grid={{ horizontal: true }}
                    margin={{ left: 50, right: 20, top: 10, bottom: 40 }}
                  />
                </div>
              </Secao>
            )}

            {/* ── Análise por Turno ─────────────────────────────────── */}
            {dadosTurno.length > 0 && (
              <Secao titulo="Análise por Turno"
                subtitulo="Clique em uma linha da tabela para filtrar o dashboard por aquele turno">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={{ background: PALETTE.bgCard, border: `1px solid ${PALETTE.border}`,
                    borderRadius: 16, padding: "20px" }}>
                    <BarChart
                      dataset={turnosFiltrados}
                      series={[
                        { dataKey: "producao", label: "Produção (kg)", color: PALETTE.azulClaro, valueFormatter: (v) => `${fmt(v)} kg` },
                        { dataKey: "refugo",   label: "Refugo (kg)",   color: PALETTE.vermelhoClaro, valueFormatter: (v) => `${fmt(v)} kg` },
                        { dataKey: "retalho",  label: "Retalho (kg)",  color: PALETTE.amareloClaro, valueFormatter: (v) => `${fmt(v)} kg` },
                      ]}
                      xAxis={[{ scaleType: "band", dataKey: "turno",
                        tickLabelStyle: { fill: PALETTE.textMuted, fontSize: 12 } }]}
                      yAxis={[{ tickLabelStyle: { fill: PALETTE.textMuted, fontSize: 11 } }]}
                      height={240}
                      onAxisClick={(_, d) => {
                        const t = d?.axisValue;
                        setTurnoSelecionado(turnoSelecionado === t ? null : t);
                        setLinhaSelecionada(null);
                      }}
                      sx={{ "& .MuiChartsAxis-line": { stroke: PALETTE.border },
                        "& .MuiChartsGrid-line": { stroke: PALETTE.border, opacity: 0.3 },
                        cursor: "pointer" }}
                      grid={{ horizontal: true }}
                      margin={{ left: 60, right: 10, top: 10, bottom: 30 }}
                    />
                    <p style={{ fontSize: 11, color: PALETTE.textMuted, textAlign: "center",
                      margin: "8px 0 0" }}>💡 Clique em uma barra para filtrar</p>
                  </div>

                  <TabelaAnalitica
                    dados={dadosTurno}
                    chave="turno"
                    selecionado={turnoSelecionado}
                    onSelecionar={(t) => { setTurnoSelecionado(t); setLinhaSelecionada(null); }}
                    colunas={[
                      { key: "turno", label: "Turno", render: (v) =>
                        <strong style={{ color: PALETTE.text }}>{v}</strong> },
                      { key: "producao", label: "Produção", align: "right",
                        render: (v) => <span style={{ fontFamily: "DM Mono" }}>{fmt(v)} kg</span> },
                      { key: "eficiencia", label: "Efic.", align: "right",
                        render: (v) => <span style={{ color: corEficiencia(v), fontWeight: 700,
                          fontFamily: "DM Mono" }}>{v}%</span> },
                      { key: "produtividade", label: "kg/h", align: "right",
                        render: (v) => <span style={{ fontFamily: "DM Mono", color: PALETTE.textMuted }}>{v}</span> },
                      { key: "horasParadas", label: "Paradas", align: "right",
                        render: (v) => <span style={{ color: v > 2 ? PALETTE.vermelhoClaro : PALETTE.textMuted,
                          fontFamily: "DM Mono" }}>{v}h</span> },
                    ]}
                  />
                </div>
              </Secao>
            )}

            {/* ── Análise por Linha ─────────────────────────────────── */}
            {dadosLinha.length > 0 && (
              <Secao titulo="Análise por Linha"
                subtitulo="Performance de cada linha de produção">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={{ background: PALETTE.bgCard, border: `1px solid ${PALETTE.border}`,
                    borderRadius: 16, padding: "20px" }}>
                    <BarChart
                      dataset={linhasFiltradas}
                      series={[
                        { dataKey: "producao", label: "Produção (kg)", color: PALETTE.azulClaro, valueFormatter: (v) => `${fmt(v)} kg` },
                        { dataKey: "refugo",   label: "Refugo (kg)",   color: PALETTE.vermelhoClaro, valueFormatter: (v) => `${fmt(v)} kg` },
                        { dataKey: "retalho",  label: "Retalho (kg)",  color: PALETTE.amareloClaro, valueFormatter: (v) => `${fmt(v)} kg` },
                      ]}
                      xAxis={[{ scaleType: "band", dataKey: "linha",
                        tickLabelStyle: { fill: PALETTE.textMuted, fontSize: 12 } }]}
                      yAxis={[{ tickLabelStyle: { fill: PALETTE.textMuted, fontSize: 11 } }]}
                      height={240}
                      onAxisClick={(_, d) => {
                        const l = d?.axisValue;
                        setLinhaSelecionada(linhaSelecionada === l ? null : l);
                        setTurnoSelecionado(null);
                      }}
                      sx={{ "& .MuiChartsAxis-line": { stroke: PALETTE.border },
                        "& .MuiChartsGrid-line": { stroke: PALETTE.border, opacity: 0.3 },
                        cursor: "pointer" }}
                      grid={{ horizontal: true }}
                      margin={{ left: 60, right: 10, top: 10, bottom: 30 }}
                    />
                  </div>
                  <TabelaAnalitica
                    dados={dadosLinha}
                    chave="linha"
                    selecionado={linhaSelecionada}
                    onSelecionar={(l) => { setLinhaSelecionada(l); setTurnoSelecionado(null); }}
                    colunas={[
                      { key: "linha", label: "Linha", render: (v) =>
                        <strong style={{ color: PALETTE.text }}>{v}</strong> },
                      { key: "producao", label: "Produção", align: "right",
                        render: (v) => <span style={{ fontFamily: "DM Mono" }}>{fmt(v)} kg</span> },
                      { key: "refugo", label: "Refugo", align: "right",
                        render: (v) => <span style={{ fontFamily: "DM Mono", color: PALETTE.vermelhoClaro }}>{fmt(v)} kg</span> },
                      { key: "retalho", label: "Retalho", align: "right",
                        render: (v) => <span style={{ fontFamily: "DM Mono", color: PALETTE.amareloClaro }}>{fmt(v)} kg</span> },
                      { key: "eficiencia", label: "Efic.", align: "right",
                        render: (v) => <span style={{ color: corEficiencia(v), fontWeight: 700,
                          fontFamily: "DM Mono" }}>{v}%</span> },
                    ]}
                  />
                </div>
              </Secao>
            )}

            {/* ── Principais Motivos ─────────────────────────────────── */}
            {dados?.registrosRaw && (
              <Secao titulo="Principais Motivos" subtitulo="Top 5 causas de refugo, retalho e paradas no período">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                  {[
                    { titulo: "🔴 Motivos de Refugo", campo: "motivoRefugo", campoPeso: "refugo",
                      cor: PALETTE.vermelhoClaro },
                    { titulo: "🟡 Motivos de Retalho", campo: "motivoRetalho", campoPeso: "retalhoKg",
                      cor: PALETTE.amareloClaro },
                    { titulo: "🔵 Motivos de Parada", campo: "descParada1", campoPeso: null,
                      cor: PALETTE.azulClaro },
                  ].map(({ titulo, campo, campoPeso, cor }) => {
                    const motivos = processarMotivos(dados.registrosRaw, campo, campoPeso);
                    return (
                      <div key={titulo}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: PALETTE.text,
                          marginBottom: 12 }}>{titulo}</p>
                        {motivos.length === 0 ? (
                          <div style={{ background: PALETTE.bgCard, border: `1px solid ${PALETTE.border}`,
                            borderRadius: 12, padding: 20, textAlign: "center",
                            color: PALETTE.textMuted, fontSize: 13 }}>
                            Nenhum registro no período
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {motivos.map((m, i) => (
                              <MotivoCard key={m.motivo} {...m} cor={cor} rank={i + 1} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Secao>
            )}

            {!dados?.totalRegistros && (
              <div style={{ textAlign: "center", padding: "60px 0", color: PALETTE.textMuted }}>
                <p style={{ fontSize: 18 }}>Nenhum registro encontrado</p>
                <p style={{ fontSize: 13 }}>Ajuste o período ou os filtros.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
