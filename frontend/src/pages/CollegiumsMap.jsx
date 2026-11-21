import React from 'react';
import { AlertTriangle, Check, Clock, ArrowLeft } from 'lucide-react';

const GroupCard = ({ status, title, sub, count }) => {
  const config = {
    success: { border: 'border-green-500', bg: 'bg-green-50', icon: <Check size={16}/>, text: 'text-green-700' },
    warning: { border: 'border-yellow-400 border-dashed', bg: 'bg-yellow-50', icon: <Clock size={16}/>, text: 'text-yellow-700' },
    danger: { border: 'border-red-500', bg: 'bg-red-50', icon: <AlertTriangle size={16}/>, text: 'text-red-700' },
  }[status];

  return (
    <div className={`border-2 rounded-xl p-2 text-center w-24 ${config.border} ${config.bg}`}>
      <div className={`flex justify-center items-center gap-1 font-bold ${config.text}`}>
        {config.icon} {count}
      </div>
      <div className="text-[10px] text-gray-600 mt-1">{sub}</div>
      <div className={`mt-1 text-[10px] px-1 py-0.5 rounded border ${config.border} ${config.text}`}>
        {status === 'success' ? '✓ резерв' : status === 'warning' ? '⏳ резерв' : '⚠ резерв'}
      </div>
    </div>
  );
};

export default function CollegiumsMap() {
  return (
    <div className="min-h-screen bg-white p-8 max-w-5xl mx-auto">
      <header className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 border rounded"></div>
        <span className="font-bold">USN · Коллегия</span>
      </header>

      <div className="flex items-center gap-4 mb-8">
        <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold">21 марта 2026</button>
        <h1 className="text-lg">Турнир по классической управленческой борьбе</h1>
      </div>

      <div className="border rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg">Карта доступности · коллегии судей</h2>
          <button className="border px-4 py-1 rounded-lg text-sm bg-gray-50">1 круг</button>
        </div>

        {/* Легенда */}
        <div className="flex gap-6 mb-8 text-sm text-gray-600">
          <div className="flex items-center gap-2"><div className="w-3 h-3 border border-green-500 rounded-full"></div> Состав подтвержден</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 border border-yellow-500 rounded-full border-dashed"></div> Предложен состав</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 border border-red-500 rounded-full"></div> Не хватает кандидатов</div>
        </div>

        {/* Сетка */}
        <div className="space-y-8">
          {/* Блок: Нанимающиеся */}
          <div className="flex items-center gap-6">
            <div className="w-32 text-sm font-bold text-right">Нанимающиеся<br/>на работу</div>
            <div className="flex gap-4">
              <GroupCard status="success" title="3/3" sub="основные" count="3/3" />
              <GroupCard status="warning" title="2/3" sub="основные" count="2/3" />
              <GroupCard status="success" title="3/3" sub="основные" count="3/3" />
              <GroupCard status="danger" title="2/3" sub="основные" count="2/3" />
            </div>
          </div>
          {/* Блок: Отправляющие */}
          <div className="flex items-center gap-6">
            <div className="w-32 text-sm font-bold text-right">Отправляющие<br/>на переговоры</div>
            <div className="flex gap-4">
              <GroupCard status="success" title="3/3" sub="основные" count="3/3" />
              <GroupCard status="success" title="3/3" sub="основные" count="3/3" />
              <GroupCard status="warning" title="2/3" sub="основные" count="2/3" />
              <GroupCard status="warning" title="2/3" sub="основные" count="2/3" />
            </div>
          </div>
          {/* Блок: Доверяющие */}
          <div className="flex items-center gap-6">
            <div className="w-32 text-sm font-bold text-right">Доверяющие<br/>собственность</div>
            <div className="flex gap-4">
              <GroupCard status="success" title="3/3" sub="основные" count="3/3" />
              <GroupCard status="danger" title="1/3" sub="основные" count="1/3" />
              <GroupCard status="warning" title="2/3" sub="основные" count="2/3" />
              <GroupCard status="success" title="3/3" sub="основные" count="3/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}