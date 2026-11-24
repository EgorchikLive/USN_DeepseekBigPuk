import React from 'react';

export default function ProfileLoaded({ data, onContinue, onBack }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-10 px-4">
      <div className="w-full max-w-xl">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-800">← К контактам</button>
          <span className="text-sm text-gray-400">Шаг 2 из 3</span>
        </div>

        <h2 className="text-sm font-semibold text-gray-700 mb-4">Блок 1 · Идентификация и защита от дублей</h2>

        <div className="border-2 border-green-400 rounded-xl p-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <span className="text-green-600 text-xl">✔</span>
            <div>
              <p className="font-semibold text-green-800">Данные загружены из базы</p>
              <p className="text-sm text-green-600">Профиль найден — поля заполнены автоматически, проверьте их</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" defaultValue={data.email} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
              <input type="tel" defaultValue={data.phone} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
              <input type="text" defaultValue={data.full_name} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Компания</label>
              <input type="text" defaultValue={data.company} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Страна</label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
            </div>
          </div>

          <button onClick={onContinue} className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-800 transition">
            Продолжить
          </button>
        </div>
      </div>
    </div>
  );
}