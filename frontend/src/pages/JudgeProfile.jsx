import React from 'react';
import { Button } from '../components/UI';

const FormField = ({ label, value }) => (
  <div className="mb-4">
    <label className="block text-sm text-gray-600 mb-1">{label}</label>
    <input type="text" defaultValue={value} className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
  </div>
);

export default function JudgeProfile() {
  return (
    <div className="min-h-screen bg-white p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border rounded"></div>
          <span className="font-bold text-lg">USN · Заявки судей</span>
        </div>
        <span className="text-gray-400 text-sm">кликабельный прототип</span>
      </header>

      <div className="flex gap-12">
        {/* Левая колонка: Форма */}
        <div className="w-1/3">
          <h2 className="text-2xl font-bold mb-6">Личная информация</h2>
          <FormField label="Email" value="a.ivanova@club.ru" />
          <FormField label="Телефон" value="+7 912 345-67-89" />
          <FormField label="Компания / Клуб" value="Клуб «Гроссмейстер»" />
          <FormField label="ФИО" value="Иванова Анна Сергеевна" />
          <FormField label="Страна" value="Россия" />
          <FormField label="Город" value="Москва" />
          <FormField label="Компания" value="Компания" />
          <FormField label="Должность" value="Должность" />
        </div>

        {/* Правая колонка: Слоты */}
        <div className="w-2/3 flex flex-col pt-12">
          <div className="text-center mb-8">
            <h3 className="text-gray-500 mb-4">Желаемые слоты:</h3>
            <div className="flex items-center justify-center gap-4 mb-2">
              <span className="text-sm text-gray-600">Основной судья:</span>
              <span className="px-3 py-1 bg-gray-100 border rounded-full text-sm">21.03.2026 · 7:30</span>
              <span className="px-3 py-1 bg-gray-200 text-gray-500 rounded-full text-sm line-through">21.03.2026 · 8:05</span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <span className="text-sm text-gray-600">Резервный судья:</span>
              <span className="px-3 py-1 bg-gray-100 border rounded-full text-sm">21.03.2026 · 8:05</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mb-12">
            <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" className="w-4 h-4" defaultChecked /> Доступны / Ждут ответа</label>
            <label className="flex items-center gap-2 text-sm text-gray-400"><input type="checkbox" className="w-4 h-4" /> Нет мест</label>
          </div>

          <Button className="w-full py-3 text-lg">Принять и пересчитать сетку</Button>
        </div>
      </div>
    </div>
  );
}