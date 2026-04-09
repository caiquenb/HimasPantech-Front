// src/pages/Registros.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function Registros() {
  const { usuario } = useAuth();
  const isSupervisor = usuario?.perfil === "supervisor";

  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroData, setFiltroData] = useState("");
  const [filtroCod, setFiltroCod] = useState("");
  const [editando, setEditando] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  const buscarRegistros = async () => {
    setCarregando(true);
    try {
      // Passa perfil, setor e turno para o backend filtrar corretamente
      const params = {
        perfil: usuario.perfil,
        setor: usuario.setor,
        turno: usuario.turno,
      };
      const res = await axios.get(`${API_URL}/api/producao/recentes`, { params });
      if (res.data.success) setRegistros(res.data.data);
    } catch (err) {
      console.error("Erro ao buscar registros:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarRegistros();
  }, []);

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
            peso: res.data.data.peso,
          }));
        }
      } catch (err) {}
    }, 500);
    return () => clearTimeout(delay);
  }, [editando?.codProducao]);

  // Recalcula prodKg, retalhoKg e totalHorasParadas automaticamente no modal
  useEffect(() => {
    if (!editando) return;
    const peso = parseFloat(editando.peso) || 0;
    const prodM = parseFloat(editando.prodM) || 0;
    const retalhoM = parseFloat(editando.retalhoM) || 0;
    const h1 = parseFloat(editando.hrsParada1) || 0;
    const h2 = parseFloat(editando.hrsParada2) || 0;
    const h3 = parseFloat(editando.hrsParada3) || 0;

    setEditando((prev) => ({
      ...prev,
      prodKg: (prodM * peso).toFixed(2),
      retalhoKg: (retalhoM * peso).toFixed(2),
      totalHorasParadas: (h1 + h2 + h3).toFixed(2),
    }));
  }, [editando?.peso, editando?.prodM, editando?.retalhoM, editando?.hrsParada1, editando?.hrsParada2, editando?.hrsParada3]);

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
        prodM: sanitizar(editando.prodM),
        prodKg: sanitizar(editando.prodKg),
        refugo: sanitizar(editando.refugo),
        retalhoM: sanitizar(editando.retalhoM),
        retalhoKg: sanitizar(editando.retalhoKg),
        hrsParada1: sanitizar(editando.hrsParada1),
        hrsParada2: sanitizar(editando.hrsParada2),
        hrsParada3: sanitizar(editando.hrsParada3),
        totalHorasParadas: sanitizar(editando.totalHorasParadas),
        peso: sanitizar(editando.peso),
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
    const okCod = filtroCod
      ? r.codProducao?.toLowerCase().includes(filtroCod.toLowerCase())
      : true;
    return okData && okCod;
  });

  const campo = (label, name, type = "text", readOnly = false) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={editando?.[name] ?? ""}
        onChange={(e) =>
          !readOnly && setEditando((prev) => ({ ...prev, [name]: e.target.value }))
        }
        readOnly={readOnly}
        className={`w-full border rounded px-2 py-1 text-sm ${
          readOnly ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"
        }`}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-2xl font-bold mb-2">
        {isSupervisor ? "Todos os Registros" : "Meus Registros"}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {isSupervisor
          ? "Visualizando os últimos 5 registros de todos os operadores."
          : `Visualizando os últimos 5 registros do setor ${usuario?.setor} · turno ${usuario?.turno}.`}
      </p>

      {mensagem && (
        <div className={`mb-4 p-3 rounded text-white ${mensagem.tipo === "erro" ? "bg-red-500" : "bg-green-500"}`}>
          {mensagem.texto}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded shadow p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Filtrar por data</label>
          <input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Filtrar por código de produção</label>
          <input
            type="text"
            value={filtroCod}
            onChange={(e) => setFiltroCod(e.target.value)}
            placeholder="Ex: P001"
            className="border rounded px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => { setFiltroData(""); setFiltroCod(""); }}
          className="text-sm text-gray-500 hover:text-gray-800 underline"
        >
          Limpar filtros
        </button>
      </div>

      {/* Tabela */}
      {carregando ? (
        <p className="text-gray-500">Carregando...</p>
      ) : registrosFiltrados.length === 0 ? (
        <p className="text-gray-500">Nenhum registro encontrado.</p>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Linha</th>
                <th className="px-4 py-3 text-left">Cód. Produção</th>
                <th className="px-4 py-3 text-left">Produto</th>
                <th className="px-4 py-3 text-left">Prod. (m)</th>
                <th className="px-4 py-3 text-left">Prod. (kg)</th>
                <th className="px-4 py-3 text-left">Setor</th>
                <th className="px-4 py-3 text-left">Turno</th>
                {/* Ações só aparecem para supervisor */}
                {isSupervisor && <th className="px-4 py-3 text-left">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((r, idx) => (
                <tr key={r.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3">{r.data}</td>
                  <td className="px-4 py-3">{r.linha}</td>
                  <td className="px-4 py-3">{r.codProducao}</td>
                  <td className="px-4 py-3">{r.produto}</td>
                  <td className="px-4 py-3">{r.prodM}</td>
                  <td className="px-4 py-3">{r.prodKg}</td>
                  <td className="px-4 py-3">{r.setor}</td>
                  <td className="px-4 py-3">{r.turno}</td>
                  {isSupervisor && (
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => setEditando(r)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => excluir(r.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                      >
                        Excluir
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de edição — só supervisor chega aqui */}
      {editando && isSupervisor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-4">Editar Registro #{editando.id}</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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

              <div className="col-span-full border-t pt-3 mt-1">
                <p className="text-xs font-semibold text-gray-500 mb-2">PARADAS</p>
              </div>
              {campo("Cód. Parada 1", "codParada1")}
              {campo("Motivo 1", "descParada1")}
              {campo("Horas 1", "hrsParada1", "number")}
              {campo("Cód. Parada 2", "codParada2")}
              {campo("Motivo 2", "descParada2")}
              {campo("Horas 2", "hrsParada2", "number")}
              {campo("Cód. Parada 3", "codParada3")}
              {campo("Motivo 3", "descParada3")}
              {campo("Horas 3", "hrsParada3", "number")}
              {campo("Total Horas Paradas", "totalHorasParadas", "number", true)}
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setEditando(null)}
                className="px-4 py-2 rounded border text-sm hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                className="px-4 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
