// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Formulario from "./pages/Formulario";
import Registros from "./pages/Registros";
import Usuarios from "./pages/Usuarios";
import Dashboard from "./pages/Dashboard";
import Sidebar from "./components/Sidebar";

// Rota protegida — qualquer usuário logado
function PrivateRoute({ children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" />;
  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 p-6 w-full min-h-screen">{children}</main>
    </div>
  );
}

// Rota exclusiva para supervisores
function SupervisorRoute({ children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" />;
  if (usuario.perfil !== "supervisor") return <Navigate to="/formulario" />;
  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 p-6 w-full min-h-screen">{children}</main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Login — sem sidebar */}
          <Route path="/login" element={<Login />} />

          {/* Disponível para todos os perfis */}
          <Route path="/formulario" element={<PrivateRoute><Formulario /></PrivateRoute>} />
          <Route path="/registros"  element={<PrivateRoute><Registros /></PrivateRoute>} />

          {/* Exclusivo para supervisor */}
          <Route path="/dashboard" element={<SupervisorRoute><Dashboard /></SupervisorRoute>} />
          <Route path="/usuarios"  element={<SupervisorRoute><Usuarios /></SupervisorRoute>} />

          {/* Redireciona qualquer rota desconhecida para o formulário */}
          <Route path="*" element={<Navigate to="/formulario" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
