import React from 'react';

function Input({ label, type = 'text', placeholder, value, onChange, className = '', required = false, icon, rows }) {
  const cls = 'w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-violet/30 focus:bg-white/[0.07] transition-all text-sm';

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-white/50 mb-2">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35">{icon}</div>}
        {rows ? (
          <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} required={required} className={`${cls} resize-none ${icon ? 'pl-10' : ''}`} />
        ) : (
          <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} className={`${cls} ${icon ? 'pl-10' : ''}`} />
        )}
      </div>
    </div>
  );
}

export default Input;
