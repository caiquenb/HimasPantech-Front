// src/pages/Usuarios.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const usuarioVazio = {
  login: "", senha: "", usuario: "", setor: "", turno: "", perfil: "operador",
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState(usuarioVazio);
  const [editandoId, setEditandoId] = useState(null); // null = novo, number = edição
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  const buscarUsuarios = async () => {
    setCarregando(true);
    try {
      const res = await axios.get(`${API_URL}/usuarios`);
      setUsuarios(res.data);
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarUsuarios();
  }, []);

  const abrirNovo = () => {
    setForm(usuarioVazio);
    setEditandoId(null);
    setMostrarForm(true);
  };

  const abrirEdicao = (u) => {
    setForm({ ...u, senha: "" }); // senha em branco — só altera se preencher
    setEditandoId(u.id);
    setMostrarForm(true);
  };

  const fecharForm = () => {
    setMostrarForm(false);
    setForm(usuarioVazio);
    setEditandoId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const salvar = async () => {
    if (!form.login || !form.usuario || !form.setor || !form.turno) {
      setMensagem({ tipo: "erro", texto: "Preencha todos os campos obrigatórios." });
      return;
    }
    if (!editandoId && !form.senha) {
      setMensagem({ tipo: "erro", texto: "Informe uma senha para o novo usuário." });
      return;
    }

    try {
      if (editandoId) {
        await axios.put(`${API_URL}/usuarios/${editandoId}`, form);
        setMensagem({ tipo: "sucesso", texto: "Usuário atualizado com sucesso!" });
      } else {
        await axios.post(`${API_URL}/usuarios`, form);
        setMensagem({ tipo: "sucesso", texto: "Usuário criado com sucesso!" });
      }
      fecharForm();
      buscarUsuarios();
      setTimeout(() => setMensagem(null), 3000);
    } catch (err) {
      setMensagem({ tipo: "erro", texto: "Erro ao salvar usuário." });
    }
  };

  const excluir = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      await axios.delete(`${API_URL}/usuarios/${id}`);
      setMensagem({ tipo: "sucesso", texto: "Usuário excluído." });
      buscarUsuarios();
      setTimeout(() => setMensagem(null), 2000);
    } catch (err) {
      setMensagem({ tipo: "erro", texto: "Erro ao excluir usuário." });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
        <button
          onClick={abrirNovo}
          className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
        >
          + Novo Usuário
        </button>
      </div>

      {mensagem && (
        <div className={`mb-4 p-3 rounded text-white ${mensagem.tipo === "erro" ? "bg-red-500" : "bg-green-500"}`}>
          {mensagem.texto}
        </div>
      )}

      {/* Tabela de usuários */}
      {carregando ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Login</th>
                <th className="px-4 py-3 text-left">Setor</th>
                <th className="px-4 py-3 text-left">Turno</th>
                <th className="px-4 py-3 text-left">Perfil</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, idx) => (
                <tr key={u.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3">{u.usuario}</td>
                  <td className="px-4 py-3 text-gray-500">{u.login}</td>
                  <td className="px-4 py-3">{u.setor}</td>
                  <td className="px-4 py-3">{u.turno}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.perfil === "supervisor"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {u.perfil === "supervisor" ? "Supervisor" : "Operador"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => abrirEdicao(u)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => excluir(u.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de criação/edição */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">
              {editandoId ? "Editar Usuário" : "Novo Usuário"}
            </h3>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nome completo *</label>
                <input name="usuario" value={form.usuario} onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm" placeholder="Ex: João Silva" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Login *</label>
                <input name="login" value={form.login} onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm" placeholder="Ex: joao.silva" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Senha {editandoId ? "(deixe em branco para não alterar)" : "*"}
                </label>
                <input name="senha" value={form.senha} onChange={handleChange} type="password"
                  className="w-full border rounded px-3 py-2 text-sm" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Setor *</label>
                <input name="setor" value={form.setor} onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm" placeholder="Ex: Extrusão" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Turno *</label>
                <select name="turno" value={form.turno} onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">Selecione...</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Perfil *</label>
                <select name="perfil" value={form.perfil} onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm">
                  <option value="operador">Operador</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={fecharForm}
                className="px-4 py-2 rounded border text-sm hover:bg-gray-100">
                Cancelar
              </button>
              <button onClick={salvar}
                className="px-4 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700">
                {editandoId ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
