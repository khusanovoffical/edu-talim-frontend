import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  to,
  label = "Orqaga qaytish",
  className = ""
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <button
      onClick={handleBack}
      type="button"
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold text-slate-700 bg-white/90 hover:bg-white border border-slate-200 hover:border-blue-500 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-x-0.5 group mb-4 ${className}`}
      title="Oldingi sahifaga qaytish"
    >
      <ArrowLeft className="w-4 h-4 text-blue-700 transition-transform group-hover:-translate-x-0.5" />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
