// src/components/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-white text-black"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`;

  const isSupervisor = usuario?.perfil === "supervisor";

  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-gray-900 flex flex-col z-10">
      {/* Logo / título */}
      <div className="px-6 py-6 border-b border-gray-700">
        <h1 className="text-white text-xl font-bold">Himaflex</h1>
        <p className="text-gray-400 text-xs mt-1">{usuario?.usuario}</p>
        <p className="text-gray-500 text-xs">{usuario?.setor} · {usuario?.turno}</p>
        <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
          isSupervisor ? "bg-yellow-500 text-black" : "bg-gray-600 text-gray-200"
        }`}>
          {isSupervisor ? "Supervisor" : "Operador"}
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {/* Disponível para todos */}
        <NavLink to="/formulario" className={linkClass}>
          📋 Novo Formulário
        </NavLink>
        <NavLink to="/registros" className={linkClass}>
          📄 Meus Registros
        </NavLink>

        {/* Apenas supervisor */}
        {isSupervisor && (
          <>
            <div className="px-4 pt-4 pb-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Supervisor</p>
            </div>
            <NavLink to="/dashboard" className={linkClass}>
              📊 Dashboard
            </NavLink>
            <NavLink to="/usuarios" className={linkClass}>
              👥 Gerenciar Usuários
            </NavLink>
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-700 hover:text-white transition-colors"
        >
          🚪 Sair
        </button>
      </div>
    </div>
  );
}
