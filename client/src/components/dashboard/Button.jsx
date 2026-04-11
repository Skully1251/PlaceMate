import React from 'react';
function Button({ children, variant = 'primary', className = '', onClick, type = 'button', disabled = false, fullWidth = false }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'px-6 py-3 text-white bg-violet shadow-lg shadow-violet/25 hover:bg-violet/90 hover:shadow-violet/40 hover:scale-[1.02]',
    secondary: 'px-6 py-3 text-white/70 bg-white/[0.04] border border-white/8 hover:bg-white/[0.08] hover:border-violet/15 hover:text-white',
    ghost: 'px-4 py-2 text-white/50 hover:text-white hover:bg-violet/10',
    danger: 'px-6 py-3 text-white bg-red-600 shadow-lg shadow-red-600/20 hover:bg-red-600/90 hover:scale-[1.02]',
  };
  return (<button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}>{children}</button>);
}
export default Button;
