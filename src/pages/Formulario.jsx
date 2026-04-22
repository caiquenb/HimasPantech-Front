// src/pages/Formulario.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const MOTIVOS = [
  { cod: "01", desc: "Falta de M.P" },
  { cod: "02", desc: "Set-UP" },
  { cod: "03", desc: "Manutenção" },
  { cod: "04", desc: "Produto Fora do Especificado" },
  { cod: "05", desc: "Quebra de Fio" },
  { cod: "06", desc: "Problema de Ar" },
  { cod: "07", desc: "Falta de Energia" },
  { cod: "08", desc: "Falta de Programação" },
  { cod: "09", desc: "Outros" },
  { cod: "10", desc: "Problema na Máquina de Gravação" },
  { cod: "11", desc: "Problema M.P" },
  { cod: "12", desc: "Problema na Ferramenta" },
  { cod: "13", desc: "Ajuste de Processo" },
  { cod: "14", desc: "Falta de Operador" },
];

function SeletorMotivo({ name, value, onChange, placeholder = "Selecione ou busque..." }) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtrados = MOTIVOS.filter(
    (m) => m.desc.toLowerCase().includes(busca.toLowerCase()) || m.cod.includes(busca)
  );

  const selecionar = (m) => {
    onChange({ target: { name, value: `${m.cod} - ${m.desc}` } });
    setBusca("");
    setAberto(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setAberto((v) => !v)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        border: `1.5px solid ${aberto ? "#3b82f6" : "#e5e7eb"}`,
        borderRadius: 8, padding: "9px 12px", background: "#fff",
        cursor: "pointer", minHeight: 40, transition: "border-color 0.15s",
      }}>
        <span style={{ fontSize: 14, color: value ? "#111827" : "#9ca3af", flex: 1 }}>
          {value || placeholder}
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {value && (
            <button type="button"
              onClick={(e) => { e.stopPropagation(); onChange({ target: { name, value: "" } }); }}
              style={{ background: "none", border: "none", cursor: "pointer",
                color: "#9ca3af", fontSize: 18, lineHeight: 1 }}>×</button>
          )}
          <span style={{ color: "#9ca3af", fontSize: 11,
            display: "inline-block", transform: aberto ? "rotate(180deg)" : "none",
            transition: "transform 0.2s" }}>▼</span>
        </div>
      </div>

      {aberto && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: "#fff", border: "1.5px solid #3b82f6", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.13)", overflow: "hidden",
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #f3f4f6" }}>
            <input autoFocus type="text" value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Buscar código ou descrição..."
              style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 6,
                padding: "7px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtrados.length === 0
              ? <p style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280", margin: 0 }}>Nenhum motivo encontrado</p>
              : filtrados.map((m) => (
                <div key={m.cod} onClick={() => selecionar(m)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", cursor: "pointer",
                    background: value === `${m.cod} - ${m.desc}` ? "#eff6ff" : "#fff",
                    borderBottom: "1px solid #f9fafb",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                  onMouseLeave={e => e.currentTarget.style.background = value === `${m.cod} - ${m.desc}` ? "#eff6ff" : "#fff"}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: "#fff", background: "#3b82f6",
                    borderRadius: 6, padding: "2px 7px", minWidth: 28, textAlign: "center",
                    fontFamily: "monospace",
                  }}>{m.cod}</span>
                  <span style={{ fontSize: 13, color: "#111827" }}>{m.desc}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Formulario() {
  const { usuario } = useAuth();
  const [formData, setFormData] = useState(inicializarFormulario());
  const [mensagem, setMensagem] = useState(null);
  const [totalParadas, setTotalParadas] = useState(1);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!formData.codProducao.trim()) return;
      try {
        const res = await axios.get(`${API_URL}/api/produto/${formData.codProducao}`);
        if (res.data.success) {
          setFormData((prev) => ({ ...prev, produto: res.data.data.nome_produto, peso: res.data.data.peso }));
        } else {
          setFormData((prev) => ({ ...prev, produto: "", peso: "" }));
        }
      } catch { setFormData((prev) => ({ ...prev, produto: "", peso: "" })); }
    }, 500);
    return () => clearTimeout(delay);
  }, [formData.codProducao]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, data: new Date().toISOString().split("T")[0] }));
  }, []);

  useEffect(() => {
    const peso = parseFloat(formData.peso) || 0;
    setFormData((prev) => ({
      ...prev,
      prodKg: ((parseFloat(prev.prodM) || 0) * peso).toFixed(2),
      retalhoKg: ((parseFloat(prev.retalhoM) || 0) * peso).toFixed(2),
      totalHorasParadas: (
        (parseFloat(prev.hrsParada1) || 0) +
        (parseFloat(prev.hrsParada2) || 0) +
        (parseFloat(prev.hrsParada3) || 0)
      ).toFixed(2),
    }));
  }, [formData.peso, formData.prodM, formData.retalhoM,
      formData.hrsParada1, formData.hrsParada2, formData.hrsParada3]);

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

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleHouveParada = (e) => {
    if (e.target.value === "Não") {
      setTotalParadas(1);
      setFormData((prev) => ({
        ...prev, houveParada: "Não",
        codParada1: "", descParada1: "", hrsParada1: "",
        codParada2: "", descParada2: "", hrsParada2: "",
        codParada3: "", descParada3: "", hrsParada3: "",
        totalHorasParadas: "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, houveParada: "Sim" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.codProducao.trim()) {
      setMensagem({ tipo: "erro", texto: "Preencha o Código de Produção antes de enviar." });
      return;
    }
    const san = (v) => (v === "" || v === undefined ? null : v);
    const payload = {
      data: formData.data, setor: usuario.setor, turno: usuario.turno,
      linha: formData.linha, codProducao: formData.codProducao,
      produto: formData.produto, peso: san(formData.peso),
      codigo_of: formData.codigo_of, prodM: san(formData.prodM),
      prodKg: san(formData.prodKg), refugo: san(formData.refugo),
      motivoRefugo: san(formData.motivoRefugo),
      retalhoM: san(formData.retalhoM), retalhoKg: san(formData.retalhoKg),
      motivoRetalho: san(formData.motivoRetalho),
      houveParada: formData.houveParada,
      codParada1: san(formData.codParada1), descParada1: san(formData.descParada1), hrsParada1: san(formData.hrsParada1),
      codParada2: san(formData.codParada2), descParada2: san(formData.descParada2), hrsParada2: san(formData.hrsParada2),
      codParada3: san(formData.codParada3), descParada3: san(formData.descParada3), hrsParada3: san(formData.hrsParada3),
      totalHorasParadas: san(formData.totalHorasParadas),
    };
    try {
      const res = await axios.post(`${API_URL}/api/formulario`, payload);
      if (res.data.success) {
        setMensagem({ tipo: "sucesso", texto: "Formulário enviado com sucesso!" });
        setFormData({ ...inicializarFormulario(), data: new Date().toISOString().split("T")[0] });
        setTotalParadas(1);
        setTimeout(() => setMensagem(null), 3000);
      } else {
        setMensagem({ tipo: "erro", texto: "Erro ao enviar os dados." });
      }
    } catch { setMensagem({ tipo: "erro", texto: "Erro ao conectar com o servidor." }); }
  };

  if (!usuario) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}><p>Carregando...</p></div>;

  const card = { background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "24px 28px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" };
  const lbl = { fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 6 };
  const inp = { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff", color: "#111827" };
  const ro = { ...inp, background: "#f8fafc", color: "#64748b", cursor: "not-allowed" };
  const secH = (icon, text) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, padding: "10px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e5e7eb" }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 0.8 }}>{text}</span>
    </div>
  );
  const g2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: "28px 32px", fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Cabeçalho */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>Formulário de Produção</h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[{ icon: "👤", v: usuario.usuario }, { icon: "🏭", v: usuario.setor }, { icon: "🕐", v: `Turno ${usuario.turno}` }].map(i => (
              <span key={i.v} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "5px 12px", fontWeight: 600 }}>
                {i.icon} {i.v}
              </span>
            ))}
          </div>
        </div>

        {mensagem && (
          <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 10, fontWeight: 600, fontSize: 14,
            background: mensagem.tipo === "erro" ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${mensagem.tipo === "erro" ? "#fecaca" : "#bbf7d0"}`,
            color: mensagem.tipo === "erro" ? "#dc2626" : "#16a34a" }}>
            {mensagem.tipo === "erro" ? "❌" : "✅"} {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Identificação */}
          <div style={card}>
            {secH("📋", "Identificação")}
            <div style={g2}>
              <div><label style={lbl}>Data</label><input type="date" name="data" value={formData.data} readOnly style={ro} /></div>
              <div><label style={lbl}>Linha de Produção</label><input type="text" name="linha" value={formData.linha} onChange={handleChange} placeholder="Ex: Linha 1" style={inp} onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#e5e7eb"} /></div>
              <div>
                <label style={lbl}>Código de Produção <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="text" name="codProducao" value={formData.codProducao} onChange={handleChange} placeholder="Ex: P001" required style={inp} onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#e5e7eb"} />
              </div>
              <div><label style={lbl}>OF (Ordem de Fabricação)</label><input type="text" name="codigo_of" value={formData.codigo_of} onChange={handleChange} placeholder="Ex: OF-1001" style={inp} onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#e5e7eb"} /></div>
              <div><label style={lbl}>Produto</label><input type="text" name="produto" value={formData.produto} readOnly placeholder="Preenchido automaticamente pelo código" style={ro} /></div>
              <div><label style={lbl}>Peso (kg/m)</label><input type="text" name="peso" value={formData.peso} readOnly placeholder="Preenchido automaticamente" style={ro} /></div>
            </div>
          </div>

          {/* Produção */}
          <div style={card}>
            {secH("⚙️", "Produção")}
            <div style={g2}>
              <div><label style={lbl}>Produção (m)</label><input type="number" name="prodM" value={formData.prodM} onChange={handleChange} placeholder="0" min="0" style={inp} onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#e5e7eb"} /></div>
              <div><label style={lbl}>Produção (kg) <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400, textTransform: "none" }}>calculado</span></label><input type="text" name="prodKg" value={formData.prodKg} readOnly style={ro} /></div>
            </div>
          </div>

          {/* Refugo & Retalho */}
          <div style={card}>
            {secH("♻️", "Refugo & Retalho")}
            <div style={g2}>
              <div><label style={lbl}>Refugo (kg)</label><input type="number" name="refugo" value={formData.refugo} onChange={handleChange} placeholder="0" min="0" style={inp} onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#e5e7eb"} /></div>
              <div><label style={lbl}>Retalho (m)</label><input type="number" name="retalhoM" value={formData.retalhoM} onChange={handleChange} placeholder="0" min="0" style={inp} onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#e5e7eb"} /></div>
              <div>
                <label style={lbl}>Motivo do Refugo</label>
                <SeletorMotivo name="motivoRefugo" value={formData.motivoRefugo} onChange={handleChange} placeholder="Selecione o motivo..." />
              </div>
              <div>
                <label style={lbl}>Retalho (kg) <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400, textTransform: "none" }}>calculado</span></label>
                <input type="text" name="retalhoKg" value={formData.retalhoKg} readOnly style={ro} />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={lbl}>Motivo do Retalho</label>
              <SeletorMotivo name="motivoRetalho" value={formData.motivoRetalho} onChange={handleChange} placeholder="Selecione o motivo..." />
            </div>
          </div>

          {/* Paradas */}
          <div style={card}>
            {secH("⏸️", "Paradas de Máquina")}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6 }}>Houve parada?</span>
              <div style={{ display: "flex", gap: 12 }}>
                {["Não", "Sim"].map((op) => (
                  <label key={op} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input type="radio" name="houveParada" value={op} checked={formData.houveParada === op} onChange={handleHouveParada} style={{ accentColor: "#3b82f6", width: 16, height: 16 }} />
                    <span style={{ fontSize: 14, fontWeight: formData.houveParada === op ? 700 : 400, color: formData.houveParada === op ? "#1d4ed8" : "#6b7280" }}>{op}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.houveParada === "Sim" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {Array.from({ length: totalParadas }, (_, idx) => idx + 1).map((i) => (
                  <div key={i} style={{ background: "#f8fafc", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>⏸ Parada {i}</span>
                      {i === totalParadas && totalParadas > 1 && (
                        <button type="button"
                          onClick={() => { setFormData(p => ({ ...p, [`codParada${i}`]: "", [`descParada${i}`]: "", [`hrsParada${i}`]: "" })); setTotalParadas(p => p - 1); }}
                          style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#dc2626", cursor: "pointer", fontWeight: 600 }}>
                          ✕ Remover
                        </button>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                      <div><label style={lbl}>Motivo</label><SeletorMotivo name={`descParada${i}`} value={formData[`descParada${i}`]} onChange={handleChange} placeholder="Selecione..." /></div>
                      <div><label style={lbl}>Horas Paradas</label><input type="number" name={`hrsParada${i}`} value={formData[`hrsParada${i}`]} onChange={handleChange} placeholder="0.0" min="0" step="0.5" style={inp} onFocus={e=>e.target.style.borderColor="#3b82f6"} onBlur={e=>e.target.style.borderColor="#e5e7eb"} /></div>
                    </div>
                  </div>
                ))}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  {totalParadas < 3
                    ? <button type="button" onClick={() => setTotalParadas(p => p + 1)} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "8px 16px", fontSize: 13, color: "#1d4ed8", cursor: "pointer", fontWeight: 600 }}>+ Adicionar outra parada</button>
                    : <span style={{ fontSize: 12, color: "#94a3b8" }}>Máximo de 3 paradas</span>}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Total paradas:</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", fontFamily: "monospace" }}>{formData.totalHorasParadas || "0.00"}h</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button type="submit" style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", border: "none", borderRadius: 12, padding: "15px 32px", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(59,130,246,0.35)", letterSpacing: 0.3 }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-1px)"; e.target.style.boxShadow = "0 6px 24px rgba(59,130,246,0.45)"; }}
            onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "0 4px 16px rgba(59,130,246,0.35)"; }}>
            ✓ Enviar Formulário
          </button>
        </form>
      </div>
    </div>
  );
}

export default Formulario;
