// src/components/HoseBar.jsx
// Barra de progresso estilo mangueira — identidade visual Himaflex
// Uso: <HoseBar valor={6.01} meta={6} unidade="%" cor="#ef4444" />

import React from "react";

const RIBS = Array.from({ length: 13 }, (_, i) => 30 + i * 30); // costelas do tubo

export default function HoseBar({ valor, meta, unidade = "%", cor }) {
  if (meta == null || typeof valor !== "number") return null;

  // Largura do preenchimento: valor relativo à meta * 1.5 (para dar espaço visual)
  const pct = Math.min((valor / (meta * 1.5)) * 100, 100);
  const fillWidth = Math.max(pct * 3.92, 8); // 3.92 = 392px * 0.01

  return (
    <div style={{ marginTop: 10 }}>
      {/* Labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: "#8896b3" }}>
          Meta: {meta}{unidade}
        </span>
        <span style={{ fontSize: 10, color: cor, fontWeight: 600 }}>
          {valor}{unidade}
        </span>
      </div>

      {/* Mangueira SVG */}
      <svg
        width="100%"
        viewBox="0 0 400 28"
        style={{ overflow: "visible", display: "block" }}
        aria-label={`Barra de progresso: ${valor}${unidade} de meta ${meta}${unidade}`}
      >
        <defs>
          {/* Clip para o preenchimento não vazar das bordas */}
          <clipPath id={`hose-clip-${meta}`}>
            <rect x="4" y="3" width="392" height="22" rx="11" />
          </clipPath>

          {/* Brilho cilíndrico (efeito de tubo 3D) */}
          <linearGradient
            id={`hose-shine-${meta}`}
            x1="0" y1="0" x2="0" y2="1"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%"   stopColor="white" stopOpacity="0.28" />
            <stop offset="35%"  stopColor="white" stopOpacity="0.06" />
            <stop offset="100%" stopColor="black" stopOpacity="0.18" />
          </linearGradient>
        </defs>

        {/* ── Corpo do tubo (trilho vazio) ── */}
        <rect
          x="0" y="2" width="400" height="24" rx="12"
          fill="#0f172a"
          stroke="#2a3350"
          strokeWidth="1.5"
        />

        {/* ── Costelas da mangueira (textura) ── */}
        <g clipPath={`url(#hose-clip-${meta})`} opacity="0.1">
          {RIBS.map(x => (
            <line
              key={x}
              x1={x} y1="3" x2={x} y2="25"
              stroke="white"
              strokeWidth="2"
            />
          ))}
        </g>

        {/* ── Fluido (preenchimento colorido) ── */}
        <rect
          x="1" y="3"
          width={fillWidth}
          height="22"
          rx="11"
          fill={cor}
          clipPath={`url(#hose-clip-${meta})`}
          style={{ transition: "width 0.7s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />

        {/* ── Brilho sobre o fluido ── */}
        <rect
          x="1" y="3"
          width={fillWidth}
          height="22"
          rx="11"
          fill={`url(#hose-shine-${meta})`}
          clipPath={`url(#hose-clip-${meta})`}
        />

        {/* ── Conector esquerdo (bocal) ── */}
        <rect x="0"   y="9" width="6"  height="10" rx="2" fill="#1e293b" />
        <rect x="0"   y="11" width="4" height="6"  rx="1" fill="#334155" />

        {/* ── Conector direito (bocal) ── */}
        <rect x="394" y="9" width="6"  height="10" rx="2" fill="#1e293b" />
        <rect x="396" y="11" width="4" height="6"  rx="1" fill="#334155" />
      </svg>
    </div>
  );
}
