import React from 'react';

function GlassCard({ children, className = '', hover = true, onClick, padding = 'p-6' }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/[0.04] backdrop-blur-sm border border-white/8 rounded-2xl ${padding} ${
        hover ? 'hover:bg-white/[0.07] hover:border-violet/20 transition-all duration-500' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export default GlassCard;
