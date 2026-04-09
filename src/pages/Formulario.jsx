// src/pages/Formulario.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

function Formulario() {
  const { usuario } = useAuth();
  const [formData, setFormData] = useState(inicializarFormulario());
  const [mensagem, setMensagem] = useState(null);
  const [totalParadas, setTotalParadas] = useState(1); // começa mostrando só 1 parada

  // Busca produto automaticamente ao digitar o código de produção
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const buscarProduto = async () => {
        if (formData.codProducao.trim() === "") return;
        try {
          const res = await axios.get(`${API_URL}/api/produto/${formData.codProducao}`);
          if (res.data.success) {
            setFormData((prev) => ({
              ...prev,
              produto: res.data.data.nome_produto,
              peso: res.data.data.peso,
            }));
          } else {
            setFormData((prev) => ({ ...prev, produto: "", peso: "" }));
          }
        } catch (err) {
          console.error("Erro ao buscar produto:", err);
          setFormData((prev) => ({ ...prev, produto: "", peso: "" }));
        }
      };
      buscarProduto();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [formData.codProducao]);

  // Preenche a data de hoje ao montar o componente
  useEffect(() => {
    const hoje = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({ ...prev, data: hoje }));
  }, []);

  // Calcula prodKg, retalhoKg e totalHorasParadas automaticamente
  useEffect(() => {
    const peso = parseFloat(formData.peso) || 0;
    const prodM = parseFloat(formData.prodM) || 0;
    const retalhoM = parseFloat(formData.retalhoM) || 0;
    const h1 = parseFloat(formData.hrsParada1) || 0;
    const h2 = parseFloat(formData.hrsParada2) || 0;
    const h3 = parseFloat(formData.hrsParada3) || 0;

    setFormData((prev) => ({
      ...prev,
      prodKg: (prodM * peso).toFixed(2),
      retalhoKg: (retalhoM * peso).toFixed(2),
      totalHorasParadas: (h1 + h2 + h3).toFixed(2),
    }));
  }, [formData.peso, formData.prodM, formData.retalhoM, formData.hrsParada1, formData.hrsParada2, formData.hrsParada3]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Quando trocar "Houve Parada?" para Não, reseta paradas e volta para 1
  const handleHouveParada = (e) => {
    const value = e.target.value;
    if (value === "Não") {
      setTotalParadas(1);
      setFormData((prev) => ({
        ...prev,
        houveParada: "Não",
        codParada1: "", descParada1: "", hrsParada1: "",
        codParada2: "", descParada2: "", hrsParada2: "",
        codParada3: "", descParada3: "", hrsParada3: "",
        totalHorasParadas: "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, houveParada: "Sim" }));
    }
  };

  const adicionarParada = () => {
    if (totalParadas < 3) setTotalParadas((prev) => prev + 1);
  };

  const removerParada = (i) => {
    // Limpa os campos da parada removida
    setFormData((prev) => ({
      ...prev,
      [`codParada${i}`]: "",
      [`descParada${i}`]: "",
      [`hrsParada${i}`]: "",
    }));
    setTotalParadas((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const sanitizar = (val) => (val === "" || val === undefined ? null : val);

    const dadosComUsuario = {
      data: formData.data,
      setor: usuario.setor,
      turno: usuario.turno,
      linha: formData.linha,
      codProducao: formData.codProducao,
      produto: formData.produto,
      peso: sanitizar(formData.peso),
      codigo_of: formData.codigo_of,
      prodM: sanitizar(formData.prodM),
      prodKg: sanitizar(formData.prodKg),
      refugo: sanitizar(formData.refugo),
      motivoRefugo: sanitizar(formData.motivoRefugo),
      retalhoM: sanitizar(formData.retalhoM),
      retalhoKg: sanitizar(formData.retalhoKg),
      motivoRetalho: sanitizar(formData.motivoRetalho),
      houveParada: formData.houveParada,
      codParada1: sanitizar(formData.codParada1),
      descParada1: sanitizar(formData.descParada1),
      hrsParada1: sanitizar(formData.hrsParada1),
      codParada2: sanitizar(formData.codParada2),
      descParada2: sanitizar(formData.descParada2),
      hrsParada2: sanitizar(formData.hrsParada2),
      codParada3: sanitizar(formData.codParada3),
      descParada3: sanitizar(formData.descParada3),
      hrsParada3: sanitizar(formData.hrsParada3),
      totalHorasParadas: sanitizar(formData.totalHorasParadas),
    };

    try {
      const res = await axios.post(`${API_URL}/api/formulario`, dadosComUsuario);
      if (res.data.success) {
        setMensagem({ tipo: "sucesso", texto: "Dados enviados com sucesso!" });
        const hoje = new Date().toISOString().split("T")[0];
        setFormData({ ...inicializarFormulario(), data: hoje });
        setTotalParadas(1);
        setTimeout(() => setMensagem(null), 2000);
      } else {
        setMensagem({ tipo: "erro", texto: "Erro ao enviar os dados." });
      }
    } catch (err) {
      console.error("Erro ao enviar dados:", err);
      setMensagem({ tipo: "erro", texto: "Erro ao conectar com o servidor." });
    }
  };

  if (!usuario) return <div className="p-6 text-center text-gray-600">Carregando usuário...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-6xl">
        <h2 className="text-2xl font-bold mb-4">Formulário de Produção</h2>
        <p className="text-sm text-gray-600 mb-4">
          Usuario: <strong>{usuario.usuario}</strong> | Setor: <strong>{usuario.setor}</strong> | Turno: <strong>{usuario.turno}</strong>
        </p>

        {mensagem && (
          <div className={`mb-4 p-3 rounded text-white ${mensagem.tipo === "erro" ? "bg-red-500" : "bg-green-500"}`}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="label">Data</label>
          <input type="date" name="data" value={formData.data} readOnly className="input col-span-2" />

          <label className="label">Linha</label>
          <input type="text" name="linha" value={formData.linha} onChange={handleChange} className="input col-span-2" />

          <label className="label">Código de Produção</label>
          <input type="text" name="codProducao" value={formData.codProducao} onChange={handleChange} className="input col-span-2" required />

          <label className="label">Produto</label>
          <input type="text" name="produto" value={formData.produto} onChange={handleChange} className="input col-span-2" />

          <label className="label">Peso</label>
          <input type="text" name="peso" value={formData.peso} onChange={handleChange} className="input col-span-2" />

          <label className="label">OF</label>
          <input type="text" name="codigo_of" value={formData.codigo_of} onChange={handleChange} className="input col-span-2" />

          <label className="label">Produção (m)</label>
          <input type="number" name="prodM" value={formData.prodM} onChange={handleChange} className="input col-span-2" />

          <label className="label">Produção (kg)</label>
          <input type="text" name="prodKg" value={formData.prodKg} readOnly className="input col-span-2" />

          <label className="label">Refugo (kg)</label>
          <input type="number" name="refugo" value={formData.refugo} onChange={handleChange} className="input col-span-2" />

          <label className="label">Motivo do Refugo</label>
          <input type="text" name="motivoRefugo" value={formData.motivoRefugo} onChange={handleChange} className="input col-span-2" />

          <label className="label">Retalho (m)</label>
          <input type="number" name="retalhoM" value={formData.retalhoM} onChange={handleChange} className="input col-span-2" />

          <label className="label">Retalho (kg)</label>
          <input type="text" name="retalhoKg" value={formData.retalhoKg} readOnly className="input col-span-2" />

          <label className="label">Motivo do Retalho</label>
          <input type="text" name="motivoRetalho" value={formData.motivoRetalho} onChange={handleChange} className="input col-span-2" />

          <label className="label">Houve Parada?</label>
          <select name="houveParada" value={formData.houveParada} onChange={handleHouveParada} className="select col-span-2">
            <option value="Não">Não</option>
            <option value="Sim">Sim</option>
          </select>

          {formData.houveParada === "Sim" && (
            <>
              {/* Renderiza só as paradas que o usuário foi adicionando */}
              {Array.from({ length: totalParadas }, (_, idx) => idx + 1).map((i) => (
                <React.Fragment key={i}>
                  {/* Cabeçalho da parada com botão de remover */}
                  <div className="col-span-full flex items-center justify-between mt-2">
                    <span className="font-semibold text-gray-700">Parada {i}</span>
                    {i === totalParadas && totalParadas > 1 && (
                      <button
                        type="button"
                        onClick={() => removerParada(i)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        ✕ Remover
                      </button>
                    )}
                  </div>

                  <label className="label">Código</label>
                  <input type="text" name={`codParada${i}`} value={formData[`codParada${i}`]} onChange={handleChange} className="input col-span-2" />

                  <label className="label">Motivo</label>
                  <input type="text" name={`descParada${i}`} value={formData[`descParada${i}`]} onChange={handleChange} className="input col-span-2" />

                  <label className="label">Horas Paradas</label>
                  <input type="number" name={`hrsParada${i}`} value={formData[`hrsParada${i}`]} onChange={handleChange} className="input col-span-2" />
                </React.Fragment>
              ))}

              {/* Botão para adicionar mais paradas (máximo 3) */}
              {totalParadas < 3 && (
                <div className="col-span-full">
                  <button
                    type="button"
                    onClick={adicionarParada}
                    className="mt-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Adicionar outra parada
                  </button>
                </div>
              )}

              <label className="label">Total Horas Paradas</label>
              <input type="text" name="totalHorasParadas" value={formData.totalHorasParadas} readOnly className="input col-span-2" />
            </>
          )}

          <button type="submit" className="button col-span-full">Enviar</button>
        </form>
      </div>
    </div>
  );
}

export default Formulario;
