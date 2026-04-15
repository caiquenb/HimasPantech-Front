// src/pages/Registros.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

// ── Paleta dark (mesma do Dashboard) ─────────────────────────────────────────
const C = {
  bg:       "#0f172a",
  card:     "#1e293b",
  border:   "#334155",
  rowAlt:   "#243044",
  rowHover: "#2d3f58",
  text:     "#f1f5f9",
  muted:    "#94a3b8",
  accent:   "#3b82f6",
  accentHover: "#2563eb",
  success:  "#10b981",
  danger:   "#ef4444",
  dangerHover: "#dc2626",
  input:    "#0f172a",
  inputBorder: "#334155",
  inputFocus: "#3b82f6",
  readonly: "#1e293b",
  divider:  "#334155",
};

export default function Registros() {
  const { usuario } = useAuth();
  const isSupervisor = usuario?.perfil === "supervisor";

  const [registros, setRegistros]   = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroData, setFiltroData] = useState("");
  const [filtroCod, setFiltroCod]   = useState("");
  const [editando, setEditando]     = useState(null);
  const [mensagem, setMensagem]     = useState(null);
  const [limite, setLimite]         = useState(5);

  const buscarRegistros = async () => {
    setCarregando(true);
    try {
      const params = {
        perfil: usuario.perfil,
        setor:  usuario.setor,
        turno:  usuario.turno,
        limite,
      };
      const res = await axios.get(`${API_URL}/api/producao/recentes`, { params });
      if (res.data.success) setRegistros(res.data.data);
    } catch (err) {
      console.error("Erro ao buscar registros:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { buscarRegistros(); }, [limite]);

  // Busca produto/peso automaticamente quando codProducao muda no modal
  useEffect(() => {
    if (!editando?.codProducao?.trim()) return;
    const delay = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/produto/${editando.codProducao}`);
        if (res.data.success) {
          setEditando((prev) => ({
            ...prev,
            produto: res.data.data.nome_produto,
            peso:    res.data.data.peso,
          }));
        }
      } catch (err) {}
    }, 500);
    return () => clearTimeout(delay);
  }, [editando?.codProducao]);

  // Recalcula prodKg, retalhoKg e totalHorasParadas automaticamente no modal
  useEffect(() => {
    if (!editando) return;
    const peso      = parseFloat(editando.peso)      || 0;
    const prodM     = parseFloat(editando.prodM)     || 0;
    const retalhoM  = parseFloat(editando.retalhoM)  || 0;
    const h1        = parseFloat(editando.hrsParada1) || 0;
    const h2        = parseFloat(editando.hrsParada2) || 0;
    const h3        = parseFloat(editando.hrsParada3) || 0;
    setEditando((prev) => ({
      ...prev,
      prodKg:           (prodM * peso).toFixed(2),
      retalhoKg:        (retalhoM * peso).toFixed(2),
      totalHorasParadas:(h1 + h2 + h3).toFixed(2),
    }));
  }, [editando?.peso, editando?.prodM, editando?.retalhoM,
      editando?.hrsParada1, editando?.hrsParada2, editando?.hrsParada3]);

  const excluir = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      await axios.delete(`${API_URL}/api/producao/${id}`);
      setMensagem({ tipo: "sucesso", texto: "Registro excluído com sucesso!" });
      buscarRegistros();
      setTimeout(() => setMensagem(null), 2000);
    } catch (err) {
      setMensagem({ tipo: "erro", texto: "Erro ao excluir." });
    }
  };

  const salvarEdicao = async () => {
    try {
      const sanitizar = (val) => (val === "" || val === undefined ? null : val);
      const dados = {
        ...editando,
        prodM:            sanitizar(editando.prodM),
        prodKg:           sanitizar(editando.prodKg),
        refugo:           sanitizar(editando.refugo),
        retalhoM:         sanitizar(editando.retalhoM),
        retalhoKg:        sanitizar(editando.retalhoKg),
        hrsParada1:       sanitizar(editando.hrsParada1),
        hrsParada2:       sanitizar(editando.hrsParada2),
        hrsParada3:       sanitizar(editando.hrsParada3),
        totalHorasParadas:sanitizar(editando.totalHorasParadas),
        peso:             sanitizar(editando.peso),
      };
      const res = await axios.put(`${API_URL}/api/producao/${editando.id}`, dados);
      if (res.data.success) {
        setMensagem({ tipo: "sucesso", texto: "Registro atualizado com sucesso!" });
        setEditando(null);
        buscarRegistros();
        setTimeout(() => setMensagem(null), 2000);
      }
    } catch (err) {
      setMensagem({ tipo: "erro", texto: "Erro ao salvar edição." });
    }
  };

  const registrosFiltrados = registros.filter((r) => {
    const okData = filtroData ? r.data?.startsWith(filtroData) : true;
    const okCod  = filtroCod
      ? r.codProducao?.toLowerCase().includes(filtroCod.toLowerCase())
      : true;
    return okData && okCod;
  });

  // ── Campo do modal ────────────────────────────────────────────────────────
  const campo = (label, name, type = "text", readOnly = false) => (
    <div key={name}>
      <label style={{ display:"block", fontSize:11, fontWeight:600, color: C.muted,
        textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5,
        fontFamily:"'DM Sans', sans-serif" }}>
        {label}
      </label>
      <input
        type={type}
        value={editando?.[name] ?? ""}
        onChange={(e) => !readOnly && setEditando((prev) => ({ ...prev, [name]: e.target.value }))}
        readOnly={readOnly}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background:  readOnly ? C.readonly : C.input,
          border:      `1.5px solid ${C.inputBorder}`,
          borderRadius: 7,
          padding:     "7px 10px",
          fontSize:    13,
          color:       readOnly ? C.muted : C.text,
          fontFamily:  readOnly ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
          cursor:      readOnly ? "not-allowed" : "text",
          outline:     "none",
        }}
        onFocus={(e) => { if (!readOnly) e.target.style.borderColor = C.inputFocus; }}
        onBlur={(e)  => { e.target.style.borderColor = C.inputBorder; }}
      />
    </div>
  );

  // ── Estilos inline reutilizáveis ──────────────────────────────────────────
  const thStyle = {
    padding:         "11px 16px",
    textAlign:       "left",
    fontSize:        11,
    fontWeight:      700,
    textTransform:   "uppercase",
    letterSpacing:   "0.07em",
    color:           C.muted,
    fontFamily:      "'DM Sans', sans-serif",
    borderBottom:    `1.5px solid ${C.border}`,
    whiteSpace:      "nowrap",
    background:      C.card,
  };

  const tdStyle = {
    padding:    "11px 16px",
    fontSize:   13,
    color:      C.text,
    fontFamily: "'DM Mono', monospace",
    borderBottom: `1px solid ${C.border}`,
    whiteSpace: "nowrap",
  };

  const tdTextStyle = { ...tdStyle, fontFamily: "'DM Sans', sans-serif" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .reg-fade { animation: fadeUp 0.35s ease both; }
        .reg-row:hover td { background: ${C.rowHover} !important; transition: background 0.12s; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
      `}</style>

      <div style={{ minHeight:"100vh", background: C.bg, padding:"28px 32px",
        fontFamily:"'DM Sans', sans-serif" }}>

        {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
        <div className="reg-fade" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize:26, fontWeight:800, color: C.text, margin:0 }}>
            {isSupervisor ? "Todos os Registros" : "Meus Registros"}
          </h2>
          <p style={{ fontSize:13, color: C.muted, marginTop:5 }}>
            {isSupervisor
              ? `Visualizando os últimos ${limite} registros de todos os operadores.`
              : `Visualizando os últimos ${limite} registros do setor ${usuario?.setor} · turno ${usuario?.turno}.`}
          </p>
        </div>

        {/* ── Toast de mensagem ───────────────────────────────────────────── */}
        {mensagem && (
          <div style={{
            marginBottom: 20,
            padding:      "12px 18px",
            borderRadius: 10,
            fontSize:     13,
            fontWeight:   600,
            fontFamily:   "'DM Sans', sans-serif",
            background:   mensagem.tipo === "erro"
              ? "rgba(239,68,68,0.15)"
              : "rgba(16,185,129,0.15)",
            border: `1.5px solid ${mensagem.tipo === "erro" ? "#ef4444" : "#10b981"}`,
            color:  mensagem.tipo === "erro" ? "#f87171" : "#34d399",
          }}>
            {mensagem.tipo === "erro" ? "⚠️" : "✓"} {mensagem.texto}
          </div>
        )}

        {/* ── Filtros ─────────────────────────────────────────────────────── */}
        <div className="reg-fade" style={{
          background:    C.card,
          border:        `1.5px solid ${C.border}`,
          borderRadius:  14,
          padding:       "18px 22px",
          marginBottom:  24,
          display:       "flex",
          flexWrap:      "wrap",
          gap:           16,
          alignItems:    "flex-end",
          animationDelay:"0.05s",
        }}>
          {/* Filtro data */}
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color: C.muted,
              textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>
              Filtrar por data
            </label>
            <input
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              style={{
                background: C.input, border: `1.5px solid ${C.inputBorder}`,
                borderRadius: 8, padding: "8px 12px", fontSize: 13,
                color: C.text, fontFamily: "'DM Sans', sans-serif", outline:"none",
              }}
              onFocus={(e) => (e.target.style.borderColor = C.inputFocus)}
              onBlur={(e)  => (e.target.style.borderColor = C.inputBorder)}
            />
          </div>

          {/* Filtro código */}
          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color: C.muted,
              textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>
              Código de produção
            </label>
            <input
              type="text"
              value={filtroCod}
              onChange={(e) => setFiltroCod(e.target.value)}
              placeholder="Ex: P001"
              style={{
                background: C.input, border: `1.5px solid ${C.inputBorder}`,
                borderRadius: 8, padding: "8px 12px", fontSize: 13,
                color: C.text, fontFamily: "'DM Sans', sans-serif", outline:"none",
              }}
              onFocus={(e) => (e.target.style.borderColor = C.inputFocus)}
              onBlur={(e)  => (e.target.style.borderColor = C.inputBorder)}
            />
          </div>

          {/* Limpar */}
          {(filtroData || filtroCod) && (
            <button
              onClick={() => { setFiltroData(""); setFiltroCod(""); }}
              style={{
                background: "transparent", border: `1.5px solid ${C.border}`,
                borderRadius: 8, padding: "8px 14px", fontSize: 13,
                color: C.muted, fontFamily: "'DM Sans', sans-serif",
                cursor:"pointer", fontWeight:600,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.danger; e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
            >
              ✕ Limpar filtros
            </button>
          )}
        </div>

        {/* ── Tabela ──────────────────────────────────────────────────────── */}
        <div className="reg-fade" style={{ animationDelay:"0.1s" }}>
          {carregando ? (
            // Skeleton
            <div style={{ background: C.card, border:`1.5px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{
                  height: 48,
                  background: i % 2 === 0 ? C.card : C.rowAlt,
                  borderBottom: `1px solid ${C.border}`,
                  animation: "pulse 1.4s infinite",
                }} />
              ))}
            </div>
          ) : registrosFiltrados.length === 0 ? (
            <div style={{ background: C.card, border:`1.5px solid ${C.border}`,
              borderRadius:14, padding:"48px 24px", textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📭</div>
              <p style={{ color: C.muted, fontSize:14, fontFamily:"'DM Sans', sans-serif", margin:0 }}>
                Nenhum registro encontrado.
              </p>
            </div>
          ) : (
            <div style={{ background: C.card, border:`1.5px solid ${C.border}`,
              borderRadius:14, overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Data</th>
                      <th style={thStyle}>Linha</th>
                      <th style={thStyle}>Cód. Produção</th>
                      <th style={thStyle}>Produto</th>
                      <th style={{ ...thStyle, textAlign:"right" }}>Prod. (m)</th>
                      <th style={{ ...thStyle, textAlign:"right" }}>Prod. (kg)</th>
                      <th style={thStyle}>Setor</th>
                      <th style={thStyle}>Turno</th>
                      {isSupervisor && <th style={{ ...thStyle, textAlign:"center" }}>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {registrosFiltrados.map((r, idx) => (
                      <tr
                        key={r.id}
                        className="reg-row"
                        style={{ background: idx % 2 === 0 ? C.card : C.rowAlt }}
                      >
                        <td style={tdStyle}>{r.data}</td>
                        <td style={tdTextStyle}>{r.linha ?? "—"}</td>
                        <td style={{ ...tdStyle, color: C.accent, fontWeight:600 }}>{r.codProducao}</td>
                        <td style={{ ...tdTextStyle, maxWidth:200, overflow:"hidden",
                          textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {r.produto ?? "—"}
                        </td>
                        <td style={{ ...tdStyle, textAlign:"right" }}>{r.prodM ?? "—"}</td>
                        <td style={{ ...tdStyle, textAlign:"right", color:"#34d399", fontWeight:600 }}>
                          {r.prodKg ?? "—"}
                        </td>
                        <td style={tdTextStyle}>{r.setor ?? "—"}</td>
                        <td style={{ ...tdTextStyle }}>
                          <span style={{
                            display:"inline-block",
                            padding:"2px 10px",
                            borderRadius:99,
                            fontSize:11,
                            fontWeight:700,
                            background: r.turno === "Manhã" ? "rgba(59,130,246,0.15)"
                              : r.turno === "Tarde" ? "rgba(245,158,11,0.15)"
                              : "rgba(139,92,246,0.15)",
                            color: r.turno === "Manhã" ? "#60a5fa"
                              : r.turno === "Tarde" ? "#fbbf24"
                              : "#c084fc",
                            fontFamily:"'DM Sans', sans-serif",
                          }}>
                            {r.turno ?? "—"}
                          </span>
                        </td>
                        {isSupervisor && (
                          <td style={{ ...tdStyle, textAlign:"center" }}>
                            <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
                              <button
                                onClick={() => setEditando(r)}
                                style={{
                                  background: "rgba(59,130,246,0.15)",
                                  border:     "1px solid rgba(59,130,246,0.3)",
                                  borderRadius:6, padding:"4px 12px", fontSize:12,
                                  color:"#60a5fa", fontFamily:"'DM Sans', sans-serif",
                                  fontWeight:600, cursor:"pointer",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background="rgba(59,130,246,0.3)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background="rgba(59,130,246,0.15)"; }}
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => excluir(r.id)}
                                style={{
                                  background: "rgba(239,68,68,0.15)",
                                  border:     "1px solid rgba(239,68,68,0.3)",
                                  borderRadius:6, padding:"4px 12px", fontSize:12,
                                  color:"#f87171", fontFamily:"'DM Sans', sans-serif",
                                  fontWeight:600, cursor:"pointer",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background="rgba(239,68,68,0.3)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background="rgba(239,68,68,0.15)"; }}
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Botão Exibir mais ───────────────────────────────────────────── */}
        {!carregando && registros.length >= limite && (
          <div style={{ marginTop:20, textAlign:"center" }}>
            <button
              onClick={() => setLimite((prev) => prev + 5)}
              style={{
                background:   "transparent",
                border:       `1.5px solid ${C.border}`,
                borderRadius: 9,
                padding:      "9px 28px",
                fontSize:     13,
                fontWeight:   600,
                color:        C.muted,
                fontFamily:   "'DM Sans', sans-serif",
                cursor:       "pointer",
                transition:   "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.accent;
                e.currentTarget.style.color = C.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.color = C.muted;
              }}
            >
              Exibir mais
            </button>
          </div>
        )}

        {/* ── Modal de edição — só supervisor ────────────────────────────── */}
        {editando && isSupervisor && (
          <div style={{
            position:"fixed", inset:0,
            background:"rgba(0,0,0,0.7)",
            backdropFilter:"blur(4px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            zIndex:50, padding:16,
          }}>
            <div style={{
              background:  C.card,
              border:      `1.5px solid ${C.border}`,
              borderRadius:16,
              boxShadow:   "0 24px 80px rgba(0,0,0,0.5)",
              width:        "100%",
              maxWidth:     720,
              maxHeight:    "90vh",
              overflowY:    "auto",
              padding:      28,
            }}>
              {/* Header do modal */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                marginBottom:22, paddingBottom:16, borderBottom:`1.5px solid ${C.border}` }}>
                <h3 style={{ fontSize:16, fontWeight:700, color: C.text,
                  fontFamily:"'DM Sans', sans-serif", margin:0 }}>
                  Editar Registro <span style={{ color: C.accent, fontFamily:"'DM Mono', monospace" }}>#{editando.id}</span>
                </h3>
                <button
                  onClick={() => setEditando(null)}
                  style={{ background:"transparent", border:"none", color: C.muted,
                    fontSize:20, cursor:"pointer", lineHeight:1, padding:"0 4px" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
                >✕</button>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:14 }}>
                {campo("Data", "data", "date")}
                {campo("Linha", "linha")}
                {campo("Cód. Produção", "codProducao")}
                {campo("Produto", "produto", "text", true)}
                {campo("Peso (kg/m)", "peso", "number", true)}
                {campo("OF", "codigo_of")}
                {campo("Produção (m)", "prodM", "number")}
                {campo("Produção (kg)", "prodKg", "number", true)}
                {campo("Refugo (kg)", "refugo", "number")}
                {campo("Motivo Refugo", "motivoRefugo")}
                {campo("Retalho (m)", "retalhoM", "number")}
                {campo("Retalho (kg)", "retalhoKg", "number", true)}
                {campo("Motivo Retalho", "motivoRetalho")}

                {/* Seção paradas */}
                <div style={{ gridColumn:"1 / -1", borderTop:`1px solid ${C.border}`,
                  paddingTop:14, marginTop:4 }}>
                  <p style={{ fontSize:10, fontWeight:700, color: C.muted,
                    textTransform:"uppercase", letterSpacing:"0.1em",
                    fontFamily:"'DM Sans', sans-serif", margin:0 }}>
                    Paradas
                  </p>
                </div>
                {campo("Cód. Parada 1",  "codParada1")}
                {campo("Motivo 1",       "descParada1")}
                {campo("Horas 1",        "hrsParada1", "number")}
                {campo("Cód. Parada 2",  "codParada2")}
                {campo("Motivo 2",       "descParada2")}
                {campo("Horas 2",        "hrsParada2", "number")}
                {campo("Cód. Parada 3",  "codParada3")}
                {campo("Motivo 3",       "descParada3")}
                {campo("Horas 3",        "hrsParada3", "number")}
                {campo("Total Horas Paradas", "totalHorasParadas", "number", true)}
              </div>

              {/* Ações do modal */}
              <div style={{ display:"flex", gap:10, marginTop:22,
                justifyContent:"flex-end", paddingTop:16, borderTop:`1px solid ${C.border}` }}>
                <button
                  onClick={() => setEditando(null)}
                  style={{
                    background:   "transparent",
                    border:       `1.5px solid ${C.border}`,
                    borderRadius: 8, padding:"9px 20px", fontSize:13,
                    color:        C.muted, fontFamily:"'DM Sans', sans-serif",
                    fontWeight:   600, cursor:"pointer",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.muted; e.currentTarget.style.color = C.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarEdicao}
                  style={{
                    background:   "rgba(16,185,129,0.15)",
                    border:       "1.5px solid rgba(16,185,129,0.4)",
                    borderRadius: 8, padding:"9px 24px", fontSize:13,
                    color:        "#34d399", fontFamily:"'DM Sans', sans-serif",
                    fontWeight:   700, cursor:"pointer",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background="rgba(16,185,129,0.28)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background="rgba(16,185,129,0.15)"; }}
                >
                  Salvar alterações
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
