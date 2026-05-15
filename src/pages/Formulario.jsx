// src/pages/Formulario.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

// ── Opções padronizadas (refugo, retalho e código de parada) ────────────────
const OPCOES_MOTIVO = [
  "01 - Falha de Matéria Prima",
  "02 - Set-Up",
  "03 - Falta de Matéria Prima no Funil",
  "04 - Produto Fora do Especificado",
  "05 - Quebra de Fio",
  "06 - Falta/Variação de AR na linha",
  "07 - Queda de Energia",
  "08 - Falta de programação",
  "09 - Materia prima contaminada",
  "10 - Prob. Maq. de gravação",
  "11 - Montagem de Ferramenta errada",
  "12 - Ajuste de processo",
  "13 - Falta de Operador",
  "14 - Entupimento Na caixa d'agua",
  "15 - Material queimado",
  "16 - Set-Up nos fios",
  "17 - Entupimento de tela",
  "18 - Perda de aderencia",
  "19 - Partida de Maquina",
  "20 - Manutenção Mecanica",
  "21 - Manutenção Eletrica",
  "22 - Falha operacional na mistura",
];

// ── Paleta dark industrial ──────────────────────────────────────────────────
const P = {
  bg:       "#0b0f1e",
  surface:  "#111827",
  card:     "#161d2e",
  border:   "#1e2a3a",
  accent:   "#3b82f6",
  accentL:  "#60a5fa",
  verde:    "#22c55e",
  vermelho: "#ef4444",
  amarelo:  "#f59e0b",
  text:     "#e2e8f0",
  textM:    "#94a3b8",
  textF:    "#475569",
  input:    "#0d1424",
};

const S = {
  label: {
    display: "block", fontSize: 11, fontWeight: 700, color: P.textM,
    textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 5,
  },
  input: {
    width: "100%", background: P.input, border: `1px solid ${P.border}`,
    borderRadius: 8, padding: "9px 12px", color: P.text, fontSize: 13,
    outline: "none", colorScheme: "dark", boxSizing: "border-box",
  },
  inputRO: {
    width: "100%", background: "#0a0e1a", border: `1px solid ${P.border}`,
    borderRadius: 8, padding: "9px 12px", color: P.textF, fontSize: 13,
    outline: "none", colorScheme: "dark", boxSizing: "border-box", cursor: "not-allowed",
  },
  select: {
    width: "100%", background: P.input, border: `1px solid ${P.border}`,
    borderRadius: 8, padding: "9px 12px", color: P.text, fontSize: 13,
    outline: "none", colorScheme: "dark", cursor: "pointer", boxSizing: "border-box",
  },
  section: {
    background: P.card, border: `1px solid ${P.border}`,
    borderRadius: 12, padding: "20px 22px", marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, color: P.textM,
    textTransform: "uppercase", letterSpacing: "1px",
    marginBottom: 14, display: "flex", alignItems: "center",
    justifyContent: "space-between",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
  badge: (bg, border, color) => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    background: bg, border: `1px solid ${border}`,
    borderRadius: 20, padding: "4px 12px", fontSize: 12, color,
  }),
};

function Field({ label, children, span }) {
  return (
    <div style={span === 2 ? { gridColumn: "span 2" } : span === 3 ? { gridColumn: "span 3" } : {}}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

function inicializarFormulario() {
  return {
    data: "", linha: "", codProducao: "", produto: "", peso: "", codigo_of: "",
    prodM: "", prodKg: "", refugo: "", motivoRefugo: "",
    retalhoM: "", retalhoKg: "", motivoRetalho: "",
    houveParada: "Não",
    codParada1: "", descParada1: "", hrsParada1: "",
    codParada2: "", descParada2: "", hrsParada2: "",
    codParada3: "", descParada3: "", hrsParada3: "",
    totalHorasParadas: "",
  };
}

// ── Componente principal ────────────────────────────────────────────────────
function Formulario() {
  const { usuario } = useAuth();
  const [formData, setFormData]       = useState(inicializarFormulario());
  const [mensagem, setMensagem]       = useState(null);
  const [totalParadas, setTotalParadas] = useState(1);
  const [buscando, setBuscando]       = useState(false);
  const [enviando, setEnviando]       = useState(false);

  // Data de hoje
  useEffect(() => {
    const hoje = new Date().toISOString().split("T")[0];
    setFormData((p) => ({ ...p, data: hoje }));
  }, []);

  // Busca produto pelo código (debounce 500ms)
  useEffect(() => {
    if (!formData.codProducao.trim()) return;
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await axios.get(`${API_URL}/api/produto/${formData.codProducao}`);
        if (res.data.success) {
          setFormData((p) => ({
            ...p,
            produto: res.data.data.nome_produto,
            peso:    res.data.data.peso,
          }));
        } else {
          setFormData((p) => ({ ...p, produto: "", peso: "" }));
        }
      } catch {
        setFormData((p) => ({ ...p, produto: "", peso: "" }));
      } finally {
        setBuscando(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [formData.codProducao]);

  // Cálculos automáticos
  useEffect(() => {
    const peso     = parseFloat(formData.peso)     || 0;
    const prodM    = parseFloat(formData.prodM)    || 0;
    const retalhoM = parseFloat(formData.retalhoM) || 0;
    const h1 = parseFloat(formData.hrsParada1) || 0;
    const h2 = parseFloat(formData.hrsParada2) || 0;
    const h3 = parseFloat(formData.hrsParada3) || 0;
    setFormData((p) => ({
      ...p,
      prodKg:            (prodM    * peso).toFixed(2),
      retalhoKg:         (retalhoM * peso).toFixed(2),
      totalHorasParadas: (h1 + h2 + h3).toFixed(2),
    }));
  }, [formData.peso, formData.prodM, formData.retalhoM,
      formData.hrsParada1, formData.hrsParada2, formData.hrsParada3]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleHouveParada = (e) => {
    const value = e.target.value;
    if (value === "Não") {
      setTotalParadas(1);
      setFormData((p) => ({
        ...p, houveParada: "Não",
        codParada1: "", descParada1: "", hrsParada1: "",
        codParada2: "", descParada2: "", hrsParada2: "",
        codParada3: "", descParada3: "", hrsParada3: "",
        totalHorasParadas: "",
      }));
    } else {
      setFormData((p) => ({ ...p, houveParada: "Sim" }));
    }
  };

  const adicionarParada = () => { if (totalParadas < 3) setTotalParadas((p) => p + 1); };
  const removerParada   = (i) => {
    setFormData((p) => ({
      ...p,
      [`codParada${i}`]: "", [`descParada${i}`]: "", [`hrsParada${i}`]: "",
    }));
    setTotalParadas((p) => p - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario?.usuario) {
      setMensagem({ tipo: "erro", texto: "Usuário não identificado. Faça login novamente." });
      return;
    }
    setEnviando(true);
    const san = (v) => (v === "" || v === undefined ? null : v);
    const payload = {
      data:              formData.data,
      usuario:           usuario.usuario,   // ← campo crítico
      setor:             usuario.setor,
      turno:             usuario.turno,
      linha:             formData.linha,
      codProducao:       formData.codProducao,
      produto:           formData.produto,
      peso:              san(formData.peso),
      codigo_of:         formData.codigo_of,
      prodM:             san(formData.prodM),
      prodKg:            san(formData.prodKg),
      refugo:            san(formData.refugo),
      motivoRefugo:      san(formData.motivoRefugo),
      retalhoM:          san(formData.retalhoM),
      retalhoKg:         san(formData.retalhoKg),
      motivoRetalho:     san(formData.motivoRetalho),
      houveParada:       formData.houveParada,
      codParada1:        san(formData.codParada1),
      descParada1:       san(formData.descParada1),
      hrsParada1:        san(formData.hrsParada1),
      codParada2:        san(formData.codParada2),
      descParada2:       san(formData.descParada2),
      hrsParada2:        san(formData.hrsParada2),
      codParada3:        san(formData.codParada3),
      descParada3:       san(formData.descParada3),
      hrsParada3:        san(formData.hrsParada3),
      totalHorasParadas: san(formData.totalHorasParadas),
    };
    try {
      const res = await axios.post(`${API_URL}/api/formulario`, payload);
      if (res.data.success) {
        setMensagem({ tipo: "sucesso", texto: "✅ Dados enviados com sucesso!" });
        const hoje = new Date().toISOString().split("T")[0];
        setFormData({ ...inicializarFormulario(), data: hoje });
        setTotalParadas(1);
      } else {
        setMensagem({ tipo: "erro", texto: "❌ Erro ao enviar os dados." });
      }
    } catch (err) {
      const detalhe = err?.response?.data?.erro || err.message || "Erro de conexão";
      setMensagem({ tipo: "erro", texto: `❌ ${detalhe}` });
    } finally {
      setEnviando(false);
      setTimeout(() => setMensagem(null), 4000);
    }
  };

  if (!usuario) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: "60vh", color: P.textM, fontSize: 14 }}>
      Carregando usuário...
    </div>
  );

  const temProducao = parseFloat(formData.prodKg) > 0;

  return (
    <div style={{ background: P.bg, minHeight: "100vh", padding: "24px 16px",
      fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: P.text, margin: "0 0 10px" }}>
            📋 Registro de Produção
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span style={S.badge(P.accent+"18", P.accent+"40", P.accentL)}>👤 {usuario.usuario}</span>
            <span style={S.badge(P.verde+"18",  P.verde+"40",  P.verde)}>🏭 {usuario.setor  || "Sem setor"}</span>
            <span style={S.badge(P.amarelo+"18",P.amarelo+"40",P.amarelo)}>🕐 {usuario.turno || "Sem turno"}</span>
          </div>
        </div>

        {/* Toast */}
        {mensagem && (
          <div style={{
            padding: "12px 18px", borderRadius: 10, marginBottom: 16,
            fontSize: 13, fontWeight: 600,
            background: mensagem.tipo === "sucesso" ? P.verde+"22"    : P.vermelho+"22",
            border:    `1px solid ${mensagem.tipo === "sucesso" ? P.verde+"60" : P.vermelho+"60"}`,
            color:      mensagem.tipo === "sucesso" ? P.verde           : P.vermelho,
          }}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── 1. Identificação ── */}
          <div style={S.section}>
            <div style={S.sectionTitle}><span>🗓️ Identificação do Turno</span></div>
            <div style={S.grid2}>
              <Field label="Data">
                <input type="date" name="data" value={formData.data}
                  onChange={handleChange} style={S.input} required />
              </Field>
              <Field label="Linha de Produção">
                <select name="linha" value={formData.linha}
                  onChange={handleChange} style={S.select} required>
                  <option value="">Selecione...</option>
                  {["L1","L2","L3","L4","L5","L6","L7","L8"].map(l =>
                    <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* ── 2. Produto ── */}
          <div style={S.section}>
            <div style={S.sectionTitle}>
              <span>📦 Produto</span>
              {buscando && <span style={{ fontSize: 11, color: P.accentL }}>🔍 buscando...</span>}
            </div>
            <div style={S.grid2}>
              <Field label="Código de Produção">
                <input type="text" name="codProducao" value={formData.codProducao}
                  onChange={handleChange} placeholder="Ex: 001234"
                  style={S.input} required />
              </Field>
              <Field label="OF (Ordem de Fabricação)">
                <input type="text" name="codigo_of" value={formData.codigo_of}
                  onChange={handleChange} placeholder="Ex: OF-9876" style={S.input} />
              </Field>
              <Field label="Produto (auto)" span={2}>
                <input type="text" value={formData.produto} readOnly
                  style={S.inputRO} placeholder="Preenchido automaticamente" />
              </Field>
              <Field label="Peso (kg/m)">
                <input type="number" name="peso" value={formData.peso}
                  onChange={handleChange} step="0.001" placeholder="0.000" style={S.input} />
              </Field>
            </div>
          </div>

          {/* ── 3. Produção ── */}
          <div style={S.section}>
            <div style={S.sectionTitle}><span>⚙️ Produção</span></div>
            <div style={S.grid3}>

              <Field label="Produção (metros)">
                <input type="number" name="prodM" value={formData.prodM}
                  onChange={handleChange} step="0.01" placeholder="0.00"
                  style={S.input} required />
              </Field>
              <Field label="Produção (kg — auto)">
                <input type="number" value={formData.prodKg} readOnly
                  style={S.inputRO} placeholder="0.00" />
              </Field>
              <div />

              <Field label="Refugo (kg)">
                <input type="number" name="refugo" value={formData.refugo}
                  onChange={handleChange} step="0.01" placeholder="0.00" style={S.input} />
              </Field>
              <Field label="Motivo do Refugo" span={2}>
                <select name="motivoRefugo" value={formData.motivoRefugo}
                  onChange={handleChange} style={S.select}>
                  <option value="">Selecione o motivo...</option>
                  {OPCOES_MOTIVO.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>

              <Field label="Retalho (metros)">
                <input type="number" name="retalhoM" value={formData.retalhoM}
                  onChange={handleChange} step="0.01" placeholder="0.00" style={S.input} />
              </Field>
              <Field label="Retalho (kg — auto)">
                <input type="number" value={formData.retalhoKg} readOnly
                  style={S.inputRO} placeholder="0.00" />
              </Field>
              <Field label="Motivo do Retalho">
                <select name="motivoRetalho" value={formData.motivoRetalho}
                  onChange={handleChange} style={S.select}>
                  <option value="">Selecione o motivo...</option>
                  {OPCOES_MOTIVO.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>

            </div>
          </div>

          {/* ── 4. Paradas ── */}
          <div style={S.section}>
            <div style={S.sectionTitle}>
              <span>⏸️ Paradas</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                background: formData.houveParada === "Sim" ? P.vermelho+"20" : P.verde+"20",
                color:      formData.houveParada === "Sim" ? P.vermelho       : P.verde,
                border:    `1px solid ${formData.houveParada === "Sim" ? P.vermelho : P.verde}40`,
              }}>
                {formData.houveParada === "Sim" ? "⚠ Com parada" : "✓ Sem parada"}
              </span>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Houve parada de máquina?</label>
              <select name="houveParada" value={formData.houveParada}
                onChange={handleHouveParada} style={S.select}>
                <option value="Não">Não</option>
                <option value="Sim">Sim</option>
              </select>
            </div>

            {formData.houveParada === "Sim" && (
              <>
                {Array.from({ length: totalParadas }, (_, idx) => idx + 1).map((i) => (
                  <div key={i} style={{
                    background: "#0d1525", border: `1px solid ${P.border}`,
                    borderRadius: 10, padding: "14px 16px", marginBottom: 10,
                    position: "relative",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: P.amarelo,
                      textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>
                      Parada {i}
                    </div>
                    {totalParadas > 1 && (
                      <button type="button" onClick={() => removerParada(i)}
                        style={{ position: "absolute", top: 12, right: 12,
                          background: P.vermelho+"20", border: `1px solid ${P.vermelho}40`,
                          borderRadius: 6, padding: "2px 8px", color: P.vermelho,
                          fontSize: 11, cursor: "pointer" }}>
                        ✕ Remover
                      </button>
                    )}
                    <div style={S.grid3}>
                      {/* Código — selecionável */}
                      <Field label="Código">
                        <select name={`codParada${i}`} value={formData[`codParada${i}`]}
                          onChange={handleChange} style={S.select}>
                          <option value="">Selecione...</option>
                          {OPCOES_MOTIVO.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </Field>
                      {/* Descrição — livre */}
                      <Field label="Descrição (livre)" span={2}>
                        <input type="text" name={`descParada${i}`}
                          value={formData[`descParada${i}`]} onChange={handleChange}
                          placeholder="Detalhe o ocorrido..." style={S.input} />
                      </Field>
                      <Field label="Duração (horas)">
                        <input type="number" name={`hrsParada${i}`}
                          value={formData[`hrsParada${i}`]} onChange={handleChange}
                          step="0.25" placeholder="0.00" style={S.input} />
                      </Field>
                    </div>
                  </div>
                ))}

                <div style={{ display: "flex", alignItems: "center",
                  justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
                  {totalParadas < 3 && (
                    <button type="button" onClick={adicionarParada}
                      style={{ background: P.accent+"20", border: `1px solid ${P.accent}40`,
                        borderRadius: 8, padding: "7px 16px", color: P.accentL,
                        fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      + Adicionar parada
                    </button>
                  )}
                  <div style={{ fontSize: 12, color: P.textM }}>
                    Total de horas paradas:
                    <span style={{ color: P.amarelo, fontWeight: 700, marginLeft: 6 }}>
                      {formData.totalHorasParadas || "0.00"} h
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Resumo ── */}
          {temProducao && (
            <div style={{
              background: P.accent+"10", border: `1px solid ${P.accent}30`,
              borderRadius: 12, padding: "14px 20px", marginBottom: 16,
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 12,
            }}>
              {[
                { l: "Produção",  v: `${formData.prodKg} kg`,         c: P.accentL },
                { l: "Refugo",    v: `${formData.refugo   || 0} kg`,  c: parseFloat(formData.refugo)   > 0 ? P.vermelho : P.verde },
                { l: "Retalho",   v: `${formData.retalhoKg|| 0} kg`,  c: parseFloat(formData.retalhoKg)> 0 ? P.amarelo  : P.verde },
                { l: "H. Parada", v: `${formData.totalHorasParadas||0} h`, c: P.textM },
              ].map(k => (
                <div key={k.l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: P.textM, textTransform: "uppercase", letterSpacing: "0.7px" }}>{k.l}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: k.c, fontFamily: "monospace" }}>{k.v}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Botão enviar ── */}
          <button type="submit" disabled={enviando} style={{
            width: "100%", padding: "14px", borderRadius: 10, border: "none",
            background: enviando ? P.border : `linear-gradient(135deg, ${P.accent}, #2563eb)`,
            color: "#fff", fontSize: 15, fontWeight: 800,
            cursor: enviando ? "not-allowed" : "pointer",
            opacity: enviando ? 0.6 : 1, transition: "opacity 0.2s",
          }}>
            {enviando ? "⏳ Enviando..." : "✅ Registrar Produção"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default Formulario;
