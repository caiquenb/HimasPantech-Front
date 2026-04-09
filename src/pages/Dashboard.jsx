// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart, Bar, LineChart, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL;

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ titulo, valor, unidade, cor, descricao, alerta }) {
  const cores = {
    azul:     "border-blue-500   bg-blue-50   text-blue-700",
    verde:    "border-green-500  bg-green-50  text-green-700",
    amarelo:  "border-yellow-500 bg-yellow-50 text-yellow-700",
    vermelho: "border-red-500    bg-red-50    text-red-700",
    roxo:     "border-purple-500 bg-purple-50 text-purple-700",
    cinza:    "border-gray-400   bg-gray-50   text-gray-700",
  };
  return (
    <div className={`border-l-4 rounded-lg p-4 shadow-sm ${cores[cor] || cores.cinza}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{titulo}</p>
      <p className="text-3xl font-bold mt-1">
        {valor !== null && valor !== undefined ? valor : "—"}
        <span className="text-base font-medium ml-1">{unidade}</span>
      </p>
      {descricao && <p className="text-xs mt-1 opacity-60">{descricao}</p>}
      {alerta && <p className="text-xs mt-2 font-semibold">{alerta}</p>}
    </div>
  );
}

function Secao({ titulo, children }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">{titulo}</h3>
      {children}
    </div>
  );
}

// Tooltip customizado para o gráfico de tendência
function TooltipTendencia({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded shadow p-3 text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}{p.name.includes("%") ? "%" : " kg"}
        </p>
      ))}
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────────────────────
export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const hoje = new Date().toISOString().split("T")[0];
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0];

  const [dataInicio, setDataInicio] = useState(trintaDiasAtras);
  const [dataFim, setDataFim]       = useState(hoje);
  const [setor, setSetor]           = useState("");
  const [turno, setTurno]           = useState("");

  const buscarDados = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const params = { dataInicio, dataFim };
      if (setor) params.setor = setor;
      if (turno) params.turno = turno;

      const res = await axios.get(`${API_URL}/api/dashboard`, { params });
      if (res.data.success) setDados(res.data.data);
    } catch (err) {
      console.error("Erro ao buscar dashboard:", err);
      setErro("Erro ao carregar dados. Verifique a conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDados();
  }, []);

  const corEficiencia = (v) => v >= 90 ? "verde" : v >= 75 ? "amarelo" : "vermelho";
  const corPerda      = (v) => v <= 2  ? "verde" : v <= 5  ? "amarelo" : "vermelho";

  // Calcula média de taxa de refugo para linha de referência no gráfico
  const mediaRefugo = dados?.tendenciaRefugo?.length
    ? (dados.tendenciaRefugo.reduce((a, r) => a + r.taxaRefugo, 0) / dados.tendenciaRefugo.length).toFixed(2)
    : 0;

  // Verifica se o filtro está ativo
  const filtroAtivo = setor || turno;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-1">Dashboard de Produção</h2>
        {filtroAtivo && (
          <p className="text-sm text-blue-600 mb-4">
            🔍 Filtrando por:{" "}
            {setor && <strong>{setor}</strong>}
            {setor && turno && " · "}
            {turno && <strong>Turno {turno}</strong>}
          </p>
        )}
        {!filtroAtivo && <p className="text-sm text-gray-400 mb-4">Exibindo todos os setores e turnos</p>}

        {/* ── Filtros ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded shadow p-4 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data início</label>
            <input type="date" value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data fim</label>
            <input type="date" value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="border rounded px-3 py-2 text-sm" />
          </div>

          {/* Setor — opções carregadas do banco */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Setor</label>
            <select value={setor} onChange={(e) => setSetor(e.target.value)}
              className="border rounded px-3 py-2 text-sm min-w-[140px]">
              <option value="">Todos os setores</option>
              {dados?.setoresDisponiveis?.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Turno */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Turno</label>
            <select value={turno} onChange={(e) => setTurno(e.target.value)}
              className="border rounded px-3 py-2 text-sm min-w-[140px]">
              <option value="">Todos os turnos</option>
              {dados?.turnosDisponiveis?.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <button onClick={buscarDados}
            className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
            Aplicar Filtros
          </button>

          {/* Limpar filtros */}
          {filtroAtivo && (
            <button onClick={() => { setSetor(""); setTurno(""); setTimeout(buscarDados, 50); }}
              className="text-sm text-red-500 hover:text-red-700 underline">
              ✕ Limpar filtros
            </button>
          )}

          <button onClick={() => { setDataInicio(trintaDiasAtras); setDataFim(hoje); setTimeout(buscarDados, 50); }}
            className="text-sm text-gray-400 hover:text-gray-700 underline ml-auto">
            Últimos 30 dias
          </button>
        </div>

        {carregando && (
          <div className="text-center py-20 text-gray-400 text-lg">Carregando dados...</div>
        )}
        {erro && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{erro}</div>
        )}

        {!carregando && dados && (
          <>
            {/* ── KPIs Principais ────────────────────────────────────── */}
            <Secao titulo="KPIs Principais">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                <KpiCard titulo="Produção Total" unidade="kg" cor="azul"
                  valor={dados.producaoTotal.toLocaleString("pt-BR")}
                  descricao="Volume total produzido no período" />
                <KpiCard titulo="Refugo Total" unidade="kg"
                  valor={dados.refugoTotal.toLocaleString("pt-BR")}
                  cor={corPerda(dados.taxaRefugo)}
                  descricao="Perda sem reaproveitamento" />
                <KpiCard titulo="Retalho Total" unidade="kg" cor="amarelo"
                  valor={dados.retalhoTotal.toLocaleString("pt-BR")}
                  descricao="Sobra reaproveitável" />
                <KpiCard titulo="Taxa de Refugo" unidade="%"
                  valor={dados.taxaRefugo}
                  cor={corPerda(dados.taxaRefugo)}
                  descricao="Refugo / Produção × 100"
                  alerta={dados.taxaRefugo > 5 ? "⚠️ Acima do limite recomendado" : "✅ Dentro do limite"} />
                <KpiCard titulo="Taxa de Retalho" unidade="%"
                  valor={dados.taxaRetalho}
                  cor={corPerda(dados.taxaRetalho)}
                  descricao="Retalho / Produção × 100" />
                <KpiCard titulo="Índice de Perdas" unidade="%"
                  valor={dados.indicePerdas}
                  cor={corPerda(dados.indicePerdas)}
                  descricao="(Refugo + Retalho) / Produção × 100"
                  alerta={dados.indicePerdas > 8 ? "⚠️ Alto índice de desperdício" : null} />
                <KpiCard titulo="Eficiência da Produção" unidade="%"
                  valor={dados.eficiencia}
                  cor={corEficiencia(dados.eficiencia)}
                  descricao="(Produção − Refugo) / Produção × 100" />
                <KpiCard titulo="Taxa de Produção" unidade="kg/h" cor="roxo"
                  valor={dados.taxaProducao}
                  descricao="Ritmo médio por hora de turno" />
                <KpiCard titulo="Tempo Médio de Parada" unidade="h"
                  valor={dados.tempoMedioParada}
                  cor={dados.tempoMedioParada > 2 ? "vermelho" : "cinza"}
                  descricao="Média de horas paradas por turno"
                  alerta={dados.tempoMedioParada > 2 ? "⚠️ Muitas paradas no período" : null} />
                <KpiCard titulo="Registros no Período" unidade="" cor="cinza"
                  valor={dados.totalRegistros}
                  descricao="Formulários lançados" />
              </div>
            </Secao>

            {/* ── Tendência de Refugo ──────────────────────────────── */}
            {dados.tendenciaRefugo.length > 1 && (
              <Secao titulo="Tendência de Refugo (%)">
                <div className="bg-white rounded shadow p-5">
                  <p className="text-sm text-gray-500 mb-1">
                    Acompanhe se a taxa de refugo está <strong>subindo ou caindo</strong> ao longo do período.
                    A linha tracejada é a <strong>média do período</strong> ({mediaRefugo}%).
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    Picos acima da média indicam dias com maior desperdício — útil para identificar causas.
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={dados.tendenciaRefugo}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 11 }}
                        domain={[0, 'auto']}
                      />
                      <Tooltip content={<TooltipTendencia />} />
                      <Legend />
                      {/* Linha de média como referência */}
                      <ReferenceLine
                        y={parseFloat(mediaRefugo)}
                        stroke="#6b7280"
                        strokeDasharray="6 3"
                        label={{ value: `Média ${mediaRefugo}%`, position: "insideTopRight", fontSize: 11, fill: "#6b7280" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="taxaRefugo"
                        name="Taxa de Refugo (%)"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="taxaRetalho"
                        name="Taxa de Retalho (%)"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        strokeDasharray="5 3"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Secao>
            )}

            {dados.tendenciaRefugo.length === 1 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded mb-6 text-sm">
                ℹ️ O gráfico de tendência precisa de pelo menos 2 dias de dados para ser exibido.
              </div>
            )}

            {/* ── Análise por Turno ────────────────────────────────── */}
            {dados.eficienciaPorTurno.length > 0 && (
              <Secao titulo="Análise por Turno">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-white rounded shadow p-4">
                    <p className="text-sm font-semibold text-gray-600 mb-3">Produção × Refugo × Retalho</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={dados.eficienciaPorTurno}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="turno" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="producao" name="Produção (kg)" fill="#3b82f6" />
                        <Bar dataKey="refugo"   name="Refugo (kg)"   fill="#ef4444" />
                        <Bar dataKey="retalho"  name="Retalho (kg)"  fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded shadow overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left">Turno</th>
                          <th className="px-4 py-3 text-right">Produção (kg)</th>
                          <th className="px-4 py-3 text-right">Refugo (kg)</th>
                          <th className="px-4 py-3 text-right">Eficiência</th>
                          <th className="px-4 py-3 text-right">Produtiv.</th>
                          <th className="px-4 py-3 text-right">H. Paradas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dados.eficienciaPorTurno.map((t, i) => (
                          <tr key={t.turno} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-3 font-medium">{t.turno}</td>
                            <td className="px-4 py-3 text-right">{t.producao.toLocaleString("pt-BR")}</td>
                            <td className="px-4 py-3 text-right">{t.refugo.toLocaleString("pt-BR")}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${
                              t.eficiencia >= 90 ? "text-green-600" :
                              t.eficiencia >= 75 ? "text-yellow-600" : "text-red-600"
                            }`}>{t.eficiencia}%</td>
                            <td className="px-4 py-3 text-right">{t.produtividade} kg/h</td>
                            <td className="px-4 py-3 text-right">{t.horasParadas}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Secao>
            )}

            {/* ── Análise por Linha ────────────────────────────────── */}
            {dados.eficienciaPorLinha.length > 0 && (
              <Secao titulo="Análise por Linha">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-white rounded shadow p-4">
                    <p className="text-sm font-semibold text-gray-600 mb-3">Produção × Refugo × Retalho</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={dados.eficienciaPorLinha}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="linha" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="producao" name="Produção (kg)" fill="#3b82f6" />
                        <Bar dataKey="refugo"   name="Refugo (kg)"   fill="#ef4444" />
                        <Bar dataKey="retalho"  name="Retalho (kg)"  fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded shadow overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left">Linha</th>
                          <th className="px-4 py-3 text-right">Produção (kg)</th>
                          <th className="px-4 py-3 text-right">Refugo (kg)</th>
                          <th className="px-4 py-3 text-right">Retalho (kg)</th>
                          <th className="px-4 py-3 text-right">Eficiência</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dados.eficienciaPorLinha.map((l, i) => (
                          <tr key={l.linha} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-3 font-medium">{l.linha}</td>
                            <td className="px-4 py-3 text-right">{l.producao.toLocaleString("pt-BR")}</td>
                            <td className="px-4 py-3 text-right">{l.refugo.toLocaleString("pt-BR")}</td>
                            <td className="px-4 py-3 text-right">{l.retalho.toLocaleString("pt-BR")}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${
                              l.eficiencia >= 90 ? "text-green-600" :
                              l.eficiencia >= 75 ? "text-yellow-600" : "text-red-600"
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
                <p className="text-sm">Tente ajustar o período ou os filtros aplicados.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
