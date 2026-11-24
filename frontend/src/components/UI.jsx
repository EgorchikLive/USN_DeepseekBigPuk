import React from 'react';

// Бейджи статусов
export const Badge = ({ type, text, className = '' }) => {
  const styles = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return <span className={`ui-badge ${styles[type] || styles.default} ${className}`}>{text}</span>;
};

// Кнопка
export const Button = ({ variant = 'primary', children, className = '', ...props }) => {
  const base = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none';
  const variants = {
    primary: 'bg-[#1a1f36] text-white hover:bg-[#2a3046]',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};