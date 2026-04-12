// src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ReferenceLine, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL;

// ── Cores ─────────────────────────────────────────────────────────────────────
const CORES = {
  azul:     { card: "border-blue-500   bg-blue-50   text-blue-700",   hex: "#3b82f6" },
  verde:    { card: "border-green-500  bg-green-50  text-green-700",  hex: "#22c55e" },
  amarelo:  { card: "border-yellow-500 bg-yellow-50 text-yellow-700", hex: "#f59e0b" },
  vermelho: { card: "border-red-500    bg-red-50    text-red-700",    hex: "#ef4444" },
  roxo:     { card: "border-purple-500 bg-purple-50 text-purple-700", hex: "#a855f7" },
  cinza:    { card: "border-gray-400   bg-gray-50   text-gray-700",   hex: "#6b7280" },
};

const GRAFICO_CORES = ["#3b82f6", "#ef4444", "#f59e0b", "#22c55e", "#a855f7", "#6b7280"];

// ── KPIs disponíveis para o gráfico principal ─────────────────────────────────
const KPIS_GRAFICO = [
  { key: "producao",  label: "Produção (kg)",        fonte: "eficienciaPorTurno", campo: "producao"  },
  { key: "refugo",    label: "Refugo (kg)",           fonte: "eficienciaPorTurno", campo: "refugo"    },
  { key: "retalho",   label: "Retalho (kg)",          fonte: "eficienciaPorTurno", campo: "retalho"   },
  { key: "eficiencia",label: "Eficiência (%)",        fonte: "eficienciaPorTurno", campo: "eficiencia"},
  { key: "produtividade", label: "Produtividade (kg/h)", fonte: "eficienciaPorTurno", campo: "produtividade" },
  { key: "horasParadas",  label: "Horas Paradas (h)",    fonte: "eficienciaPorTurno", campo: "horasParadas"  },
];

// ── Componentes auxiliares ────────────────────────────────────────────────────
function KpiCard({ titulo, valor, unidade, cor, descricao, alerta, ativo, onClick }) {
  const c = CORES[cor] || CORES.cinza;
  return (
    <div
      onClick={onClick}
      className={`border-l-4 rounded-lg p-4 shadow-sm transition-all ${c.card}
        ${onClick ? "cursor-pointer hover:shadow-md hover:scale-[1.02]" : ""}
        ${ativo ? "ring-2 ring-offset-1 ring-gray-800 scale-[1.02]" : ""}
      `}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{titulo}</p>
      <p className="text-3xl font-bold mt-1">
        {valor ?? "—"}<span className="text-base font-medium ml-1">{unidade}</span>
      </p>
      {descricao && <p className="text-xs mt-1 opacity-60">{descricao}</p>}
      {alerta && <p className="text-xs mt-2 font-semibold">{alerta}</p>}
      {ativo && <p className="text-xs mt-1 font-bold">📊 Exibindo no gráfico</p>}
    </div>
  );
}

function Secao({ titulo, children, id }) {
  return (
    <div className="mb-8" id={id}>
      <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">{titulo}</h3>
      {children}
    </div>
  );
}

function TooltipCustom({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-bold text-gray-700 mb-2 border-b pb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4 py-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-semibold">{typeof p.value === "number" ? p.value.toLocaleString("pt-BR") : p.value}</span>
        </div>
      ))}
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

  // Filtros
  const hoje = new Date().toISOString().split("T")[0];
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [dataInicio, setDataInicio] = useState(trintaDiasAtras);
  const [dataFim, setDataFim]       = useState(hoje);
  const [setor, setSetor]           = useState("");
  const [turno, setTurno]           = useState("");

  // Interatividade
  const [turnoSelecionado, setTurnoSelecionado] = useState(null); // clique no gráfico
  const [linhaSelecionada, setLinhaSelecionada] = useState(null);
  const [kpiGrafico, setKpiGrafico]             = useState(KPIS_GRAFICO[0]); // KPI no gráfico principal

  const buscarDados = useCallback(async (params = {}) => {
    setCarregando(true);
    setErro(null);
    setTurnoSelecionado(null);
    setLinhaSelecionada(null);
    try {
      const p = { dataInicio, dataFim, ...params };
      if (setor) p.setor = setor;
      if (turno) p.turno = turno;
      const res = await axios.get(`${API_URL}/api/dashboard`, { params: p });
      if (res.data.success) setDados(res.data.data);
    } catch {
      setErro("Erro ao carregar dados. Verifique a conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }, [dataInicio, dataFim, setor, turno]);

  useEffect(() => { buscarDados(); }, []);

  // ── Clique no gráfico de turno ──────────────────────────────────────────────
  const handleClickTurno = (entry) => {
    if (!entry?.activePayload?.[0]) return;
    const t = entry.activePayload[0].payload.turno;
    if (turnoSelecionado === t) {
      setTurnoSelecionado(null); // deseleciona ao clicar novamente
    } else {
      setTurnoSelecionado(t);
      setLinhaSelecionada(null);
    }
  };

  const handleClickLinha = (entry) => {
    if (!entry?.activePayload?.[0]) return;
    const l = entry.activePayload[0].payload.linha;
    if (linhaSelecionada === l) {
      setLinhaSelecionada(null);
    } else {
      setLinhaSelecionada(l);
      setTurnoSelecionado(null);
    }
  };

  // ── Exportar como imagem/PDF ────────────────────────────────────────────────
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#f3f4f6",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`dashboard-himaflex-${hoje}.pdf`);
    } catch (err) {
      console.error("Erro ao exportar:", err);
      alert("Erro ao exportar. Tente novamente.");
    } finally {
      setExportando(false);
    }
  };

  // ── Dados filtrados por seleção interativa ─────────────────────────────────
  const dadosTurnoFiltrado = turnoSelecionado
    ? dados?.eficienciaPorTurno?.filter((t) => t.turno === turnoSelecionado)
    : dados?.eficienciaPorTurno;

  const dadosLinhaFiltrado = linhaSelecionada
    ? dados?.eficienciaPorLinha?.filter((l) => l.linha === linhaSelecionada)
    : dados?.eficienciaPorLinha;

  // KPIs recalculados quando um turno está selecionado
  const kpiAtivos = turnoSelecionado && dados
    ? dados.eficienciaPorTurno.find((t) => t.turno === turnoSelecionado)
    : null;

  const corEficiencia = (v) => v >= 90 ? "verde" : v >= 75 ? "amarelo" : "vermelho";
  const corPerda      = (v) => v <= 2  ? "verde" : v <= 5  ? "amarelo" : "vermelho";

  const mediaRefugo = dados?.tendenciaRefugo?.length
    ? (dados.tendenciaRefugo.reduce((a, r) => a + r.taxaRefugo, 0) / dados.tendenciaRefugo.length).toFixed(2)
    : 0;

  const filtroAtivo = setor || turno;
  const selecaoAtiva = turnoSelecionado || linhaSelecionada;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Cabeçalho ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Dashboard de Produção</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {filtroAtivo
                ? `Filtrando: ${setor || "todos os setores"} · Turno ${turno || "todos"}`
                : "Todos os setores e turnos"}
            </p>
          </div>
          <button
            onClick={exportarPDF}
            disabled={exportando || carregando}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
          >
            {exportando ? "⏳ Exportando..." : "⬇️ Exportar PDF"}
          </button>
        </div>

        {/* ── Filtros ────────────────────────────────────────────────── */}
        <div className="bg-white rounded shadow p-4 mb-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data início</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
              className="border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data fim</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
              className="border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Setor</label>
            <select value={setor} onChange={(e) => setSetor(e.target.value)}
              className="border rounded px-3 py-2 text-sm min-w-[140px]">
              <option value="">Todos os setores</option>
              {dados?.setoresDisponiveis?.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Turno</label>
            <select value={turno} onChange={(e) => setTurno(e.target.value)}
              className="border rounded px-3 py-2 text-sm min-w-[140px]">
              <option value="">Todos os turnos</option>
              {dados?.turnosDisponiveis?.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={() => buscarDados()}
            className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
            Aplicar
          </button>
          {filtroAtivo && (
            <button onClick={() => { setSetor(""); setTurno(""); setTimeout(() => buscarDados({}), 50); }}
              className="text-sm text-red-500 hover:text-red-700 underline">
              ✕ Limpar
            </button>
          )}
          <button onClick={() => { setDataInicio(trintaDiasAtras); setDataFim(hoje); }}
            className="text-sm text-gray-400 hover:text-gray-700 underline ml-auto">
            Últimos 30 dias
          </button>
        </div>

        {/* Aviso de seleção interativa ativa */}
        {selecaoAtiva && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded mb-4 text-sm flex justify-between items-center">
            <span>
              🔍 Visualizando dados de:{" "}
              <strong>{turnoSelecionado ? `Turno ${turnoSelecionado}` : `Linha ${linhaSelecionada}`}</strong>
              {" "}— clique novamente no gráfico para deselecionar.
            </span>
            <button onClick={() => { setTurnoSelecionado(null); setLinhaSelecionada(null); }}
              className="text-blue-500 hover:text-blue-800 font-semibold ml-4">
              ✕ Limpar seleção
            </button>
          </div>
        )}

        {carregando && <div className="text-center py-20 text-gray-400 text-lg">Carregando dados...</div>}
        {erro && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{erro}</div>}

        {/* ── Conteúdo exportável ────────────────────────────────────── */}
        {!carregando && dados && (
          <div ref={dashboardRef}>

            {/* ── KPIs principais ──────────────────────────────────── */}
            <Secao titulo="KPIs Principais" id="kpis">
              {turnoSelecionado && kpiAtivos && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3 text-sm text-blue-700">
                  Exibindo KPIs do <strong>Turno {turnoSelecionado}</strong> individualmente
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[
                  { titulo: "Produção Total", valor: (turnoSelecionado && kpiAtivos ? kpiAtivos.producao : dados.producaoTotal).toLocaleString("pt-BR"), unidade: "kg", cor: "azul", descricao: "Volume total produzido" },
                  { titulo: "Refugo Total",   valor: (turnoSelecionado && kpiAtivos ? kpiAtivos.refugo : dados.refugoTotal).toLocaleString("pt-BR"), unidade: "kg", cor: corPerda(dados.taxaRefugo), descricao: "Perda sem reaproveitamento" },
                  { titulo: "Retalho Total",  valor: (turnoSelecionado && kpiAtivos ? kpiAtivos.retalho : dados.retalhoTotal).toLocaleString("pt-BR"), unidade: "kg", cor: "amarelo", descricao: "Sobra reaproveitável" },
                  { titulo: "Taxa de Refugo", valor: dados.taxaRefugo, unidade: "%", cor: corPerda(dados.taxaRefugo), descricao: "Refugo / Produção × 100", alerta: dados.taxaRefugo > 5 ? "⚠️ Acima do limite" : "✅ Dentro do limite" },
                  { titulo: "Taxa de Retalho", valor: dados.taxaRetalho, unidade: "%", cor: corPerda(dados.taxaRetalho), descricao: "Retalho / Produção × 100" },
                  { titulo: "Índice de Perdas", valor: dados.indicePerdas, unidade: "%", cor: corPerda(dados.indicePerdas), descricao: "(Refugo + Retalho) / Produção × 100", alerta: dados.indicePerdas > 8 ? "⚠️ Alto desperdício" : null },
                  { titulo: "Eficiência", valor: turnoSelecionado && kpiAtivos ? kpiAtivos.eficiencia : dados.eficiencia, unidade: "%", cor: corEficiencia(dados.eficiencia), descricao: "(Produção − Refugo) / Produção × 100" },
                  { titulo: "Taxa de Produção", valor: turnoSelecionado && kpiAtivos ? kpiAtivos.produtividade : dados.taxaProducao, unidade: "kg/h", cor: "roxo", descricao: "Ritmo médio por hora" },
                  { titulo: "Tempo Médio de Parada", valor: dados.tempoMedioParada, unidade: "h", cor: dados.tempoMedioParada > 2 ? "vermelho" : "cinza", descricao: "Média de horas paradas", alerta: dados.tempoMedioParada > 2 ? "⚠️ Muitas paradas" : null },
                  { titulo: "Registros no Período", valor: dados.totalRegistros, unidade: "", cor: "cinza", descricao: "Formulários lançados" },
                ].map((kpi) => (
                  <KpiCard key={kpi.titulo} {...kpi} />
                ))}
              </div>
            </Secao>

            {/* ── Gráfico principal com seletor de KPI ─────────────── */}
            <Secao titulo="Gráfico Principal" id="grafico-principal">
              <div className="bg-white rounded shadow p-5">
                {/* Seletor de KPI */}
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="text-sm text-gray-500 self-center mr-1">Visualizar:</span>
                  {KPIS_GRAFICO.map((k) => (
                    <button
                      key={k.key}
                      onClick={() => setKpiGrafico(k)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        kpiGrafico.key === k.key
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-gray-300 hover:border-gray-600"
                      }`}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-gray-400 mb-3">
                  💡 Clique em uma barra para filtrar toda a análise por aquele turno
                </p>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={dados.eficienciaPorTurno}
                    onClick={handleClickTurno}
                    style={{ cursor: "pointer" }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="turno" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }}
                      tickFormatter={(v) => kpiGrafico.key === "eficiencia" ? `${v}%` : v} />
                    <Tooltip content={<TooltipCustom />} />
                    <Legend />
                    {dados.eficienciaPorTurno.map((entry, i) => null)}
                    <Bar
                      dataKey={kpiGrafico.campo}
                      name={kpiGrafico.label}
                      radius={[4, 4, 0, 0]}
                    >
                      {dados.eficienciaPorTurno.map((entry, i) => (
                        <Cell
                          key={entry.turno}
                          fill={
                            turnoSelecionado === null || turnoSelecionado === entry.turno
                              ? GRAFICO_CORES[i % GRAFICO_CORES.length]
                              : "#d1d5db"  // cinza para os não selecionados
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Secao>

            {/* ── Tendência de Refugo ───────────────────────────────── */}
            {dados.tendenciaRefugo.length > 1 && (
              <Secao titulo="Tendência de Refugo (%)" id="tendencia">
                <div className="bg-white rounded shadow p-5">
                  <p className="text-sm text-gray-500 mb-1">
                    A linha tracejada é a <strong>média do período ({mediaRefugo}%)</strong>.
                    Picos acima da média indicam dias com maior desperdício.
                  </p>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={
                      turnoSelecionado
                        ? dados.tendenciaRefugo // tendência não muda com seleção de turno
                        : dados.tendenciaRefugo
                    }>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} domain={[0, "auto"]} />
                      <Tooltip content={<TooltipCustom />} />
                      <Legend />
                      <ReferenceLine y={parseFloat(mediaRefugo)} stroke="#6b7280" strokeDasharray="6 3"
                        label={{ value: `Média ${mediaRefugo}%`, position: "insideTopRight", fontSize: 11, fill: "#6b7280" }} />
                      <Line type="monotone" dataKey="taxaRefugo" name="Taxa de Refugo (%)"
                        stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="taxaRetalho" name="Taxa de Retalho (%)"
                        stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Secao>
            )}

            {/* ── Análise por Turno ─────────────────────────────────── */}
            {dadosTurnoFiltrado?.length > 0 && (
              <Secao titulo={turnoSelecionado ? `Detalhes — Turno ${turnoSelecionado}` : "Análise por Turno"} id="por-turno">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-white rounded shadow p-4">
                    <p className="text-sm font-semibold text-gray-600 mb-3">Produção × Refugo × Retalho</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={dadosTurnoFiltrado} onClick={handleClickTurno} style={{ cursor: "pointer" }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="turno" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip content={<TooltipCustom />} />
                        <Legend />
                        <Bar dataKey="producao" name="Produção (kg)" fill="#3b82f6" radius={[4,4,0,0]} />
                        <Bar dataKey="refugo"   name="Refugo (kg)"   fill="#ef4444" radius={[4,4,0,0]} />
                        <Bar dataKey="retalho"  name="Retalho (kg)"  fill="#f59e0b" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded shadow overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left">Turno</th>
                          <th className="px-4 py-3 text-right">Produção</th>
                          <th className="px-4 py-3 text-right">Refugo</th>
                          <th className="px-4 py-3 text-right">Eficiência</th>
                          <th className="px-4 py-3 text-right">kg/h</th>
                          <th className="px-4 py-3 text-right">H. Paradas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dadosTurnoFiltrado.map((t, i) => (
                          <tr key={t.turno}
                            onClick={() => setTurnoSelecionado(turnoSelecionado === t.turno ? null : t.turno)}
                            className={`cursor-pointer transition-colors ${
                              turnoSelecionado === t.turno
                                ? "bg-blue-50"
                                : i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"
                            }`}>
                            <td className="px-4 py-3 font-medium">{t.turno}</td>
                            <td className="px-4 py-3 text-right">{t.producao.toLocaleString("pt-BR")} kg</td>
                            <td className="px-4 py-3 text-right">{t.refugo.toLocaleString("pt-BR")} kg</td>
                            <td className={`px-4 py-3 text-right font-semibold ${
                              t.eficiencia >= 90 ? "text-green-600" : t.eficiencia >= 75 ? "text-yellow-600" : "text-red-600"
                            }`}>{t.eficiencia}%</td>
                            <td className="px-4 py-3 text-right">{t.produtividade}</td>
                            <td className="px-4 py-3 text-right">{t.horasParadas}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Secao>
            )}

            {/* ── Análise por Linha ─────────────────────────────────── */}
            {dadosLinhaFiltrado?.length > 0 && (
              <Secao titulo={linhaSelecionada ? `Detalhes — Linha ${linhaSelecionada}` : "Análise por Linha"} id="por-linha">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-white rounded shadow p-4">
                    <p className="text-xs text-gray-400 mb-2">💡 Clique em uma barra para destacar a linha</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={dados.eficienciaPorLinha} onClick={handleClickLinha} style={{ cursor: "pointer" }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="linha" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip content={<TooltipCustom />} />
                        <Legend />
                        <Bar dataKey="producao" name="Produção (kg)" radius={[4,4,0,0]}>
                          {dados.eficienciaPorLinha.map((entry, i) => (
                            <Cell key={entry.linha}
                              fill={linhaSelecionada === null || linhaSelecionada === entry.linha
                                ? GRAFICO_CORES[i % GRAFICO_CORES.length] : "#d1d5db"} />
                          ))}
                        </Bar>
                        <Bar dataKey="refugo" name="Refugo (kg)" radius={[4,4,0,0]}>
                          {dados.eficienciaPorLinha.map((entry, i) => (
                            <Cell key={entry.linha}
                              fill={linhaSelecionada === null || linhaSelecionada === entry.linha
                                ? "#ef4444" : "#fca5a5"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded shadow overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left">Linha</th>
                          <th className="px-4 py-3 text-right">Produção</th>
                          <th className="px-4 py-3 text-right">Refugo</th>
                          <th className="px-4 py-3 text-right">Retalho</th>
                          <th className="px-4 py-3 text-right">Eficiência</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dadosLinhaFiltrado.map((l, i) => (
                          <tr key={l.linha}
                            onClick={() => setLinhaSelecionada(linhaSelecionada === l.linha ? null : l.linha)}
                            className={`cursor-pointer transition-colors ${
                              linhaSelecionada === l.linha
                                ? "bg-blue-50"
                                : i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"
                            }`}>
                            <td className="px-4 py-3 font-medium">{l.linha}</td>
                            <td className="px-4 py-3 text-right">{l.producao.toLocaleString("pt-BR")} kg</td>
                            <td className="px-4 py-3 text-right">{l.refugo.toLocaleString("pt-BR")} kg</td>
                            <td className="px-4 py-3 text-right">{l.retalho.toLocaleString("pt-BR")} kg</td>
                            <td className={`px-4 py-3 text-right font-semibold ${
                              l.eficiencia >= 90 ? "text-green-600" : l.eficiencia >= 75 ? "text-yellow-600" : "text-red-600"
                            }`}>{l.eficiencia}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Secao>
            )}

            {dados.totalRegistros === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg mb-1">Nenhum registro encontrado</p>
                <p className="text-sm">Ajuste o período ou os filtros aplicados.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
