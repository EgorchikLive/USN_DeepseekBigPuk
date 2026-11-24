import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Сюда мы потом импортируем шаги. Пока сделаем заглушку.
export default function RegistrationFlow() {
  const { competitionId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Регистрация на турнир ID: {competitionId}</h1>
        <p className="text-gray-500 mb-6">Здесь будут шаги регистрации (Email, Анкета, Роль).</p>
        <button onClick={() => navigate('/tournaments')} className="text-blue-600 hover:underline">
          ← Вернуться к списку
        </button>
      </div>
    </div>
  );
}