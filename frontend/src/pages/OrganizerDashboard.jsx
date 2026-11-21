import React, { useState, useEffect } from 'react';
import { Badge, Button } from '../components/UI';
import { AlertTriangle, Check, Clock, RefreshCw } from 'lucide-react';
import apiClient from '../api/client'; // Убедитесь, что путь правильный

// --- Компоненты внутри файла ---

// Ячейка карты доступности
const SlotCell = ({ status, count, max }) => {
  const statusConfig = {
    success: {
      border: 'border-green-500',
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: <Check size={16} />,
      label: 'основные судьи',
      subLabel: '✓ резервный судья',
      subBorder: 'border-green-300'
    },
    warning: {
      border: 'border-yellow-400 border-dashed',
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      icon: <Clock size={16} />,
      label: 'основные судьи',
      subLabel: '⏳ резервный судья',
      subBorder: 'border-yellow-300'
    },
    danger: {
      border: 'border-red-500',
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: <AlertTriangle size={16} />,
      label: 'основные судьи',
      subLabel: '⚠ резервный судья',
      subBorder: 'border-red-300'
    },
  };

  const cfg = statusConfig[status] || statusConfig.success;

  return (
    <div className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center ${cfg.border} ${cfg.bg} ${cfg.text} w-32`}>
      <div className="flex items-center gap-1 font-bold mb-1">
        {cfg.icon}
        <span>{count}/{max}</span>
      </div>
      <span className="text-[10px] text-center leading-tight">{cfg.label}</span>
      <div className={`mt-2 text-[10px] px-2 py-1 rounded-full border bg-white/60 ${cfg.subBorder} w-full text-center`}>
        {cfg.subLabel}
      </div>
    </div>
  );
};

// --- Основной компонент ---

export default function OrganizerDashboard() {
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // В реальном приложении этот ID берется из URL (useParams) или из выбранного турнира
  const competitionId = "00000000-0000-0000-0000-000000000000"; 

  // Заглушка данных для карты (в будущем заменить на fetch из API)
  const mapData = [
    { row: 'Инвесторы', max: 9, slots: [ { s: 'warning', c: 8 }, { s: 'danger', c: 7 }, { s: 'success', c: 9 }, { s: 'success', c: 9 }, { s: 'success', c: 9 }, { s: 'success', c: 9 } ] },
    { row: 'Авторы', max: 3, slots: [ { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 } ] },
    { row: 'Кадры', max: 3, slots: [ { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 } ] },
  ];

  // Обработчик запуска ИИ
  const handleAllocate = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/allocate', {
        competition_id: competitionId
      });
      setAiResult(response.data);
    } catch (error) {
      console.error("Ошибка при распределении:", error);
      alert("Не удалось запустить ИИ-распределение. Проверьте бэкенд.");
    } finally {
      setLoading(false);
    }
  };

  // Обработчик сохранения и синхронизации
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // В будущем здесь будет реальный вызов API для синхронизации с Django
      // await apiClient.post('/sync-django', { competition_id: competitionId });
      
      // Имитация задержки сети
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      alert("Данные успешно сохранены и синхронизированы с Django (USN)!");
    } catch (error) {
      alert("Ошибка синхронизации");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Шапка */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center font-bold text-xs text-gray-400">Logo</div>
          <span className="font-bold text-lg text-gray-900">USN · Панель организатора</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600 font-medium">Кубок «Осень-2026» · Классический формат</div>
          <span className="text-sm text-gray-500">Судей подтверждено: <b className="text-black">27/36</b></span>
          <Badge type="danger" text="Слотов с дефицитом: 2" />
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-grow p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-[1600px] mx-auto w-full">
        
        {/* Левая колонка (Карта доступности) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Карта доступности · коллегии судей</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[#1a1f36] text-white rounded-lg text-sm font-medium">21.03</button>
              <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">22.03</button>
            </div>
          </div>

          {/* Легенда */}
          <div className="flex gap-6 mb-8 text-sm text-gray-600 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-green-500 rounded bg-green-50"></div> 
              Состав подтвержден
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-yellow-500 border-dashed rounded bg-yellow-50"></div> 
              Предложен состав
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-red-500 rounded bg-red-50"></div> 
              Не хватает кандидатов
            </div>
          </div>

          {/* Сетка карты */}
          <div className="overflow-x-auto pb-4">
            <table className="w-full border-separate border-spacing-2">
              <thead>
                <tr>
                  <th className="text-left text-sm text-gray-500 font-normal p-2 w-40">Инвесторы<br/><span className="text-xs text-gray-400">коллегия · 6 мест</span></th>
                  <th className="text-sm text-gray-500 font-normal">21.03 · утро</th>
                  <th className="text-sm text-gray-500 font-normal">21.03 · день</th>
                  <th className="text-sm text-gray-500 font-normal">21.03 · вечер</th>
                  <th className="text-sm text-gray-500 font-normal">22.03 · утро</th>
                  <th className="text-sm text-gray-500 font-normal">22.03 · день</th>
                  <th className="text-sm text-gray-500 font-normal">22.03 · вечер</th>
                </tr>
              </thead>
              <tbody>
                {mapData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="text-left font-bold p-2 text-gray-800">{row.row}</td>
                    {row.slots.map((slot, colIndex) => (
                      <td key={colIndex} className="p-1">
                        <div 
                          onClick={() => setSelectedSlot({ row: row.row, time: `21.03 · ${colIndex === 0 ? 'утро' : colIndex === 1 ? 'день' : 'вечер'}`, count: slot.c, max: row.max, status: slot.s })}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <SlotCell status={slot.s} count={slot.c} max={row.max} />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Блок выбранного слота */}
          <div className="mt-8 p-5 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-gray-900">Выбран слот: 21.03 · День</h4>
              <p className="text-sm text-gray-600 mt-1">Требуется 9 судей · подтверждено 7 · не хватает 2</p>
              <p className="text-xs text-gray-400 mt-2">Назначение судей — через ИИ-ассистент (правая панель)</p>
            </div>
            <Badge type="danger" text="дефицит: 2" />
          </div>
        </div>

        {/* Правая колонка (ИИ-ассистент) */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm flex flex-col h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-900">ИИ-ассистент распределения</h2>
          
          {/* Блок дефицита */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
              <AlertTriangle size={18} />
              Обнаружен дефицит
            </div>
            <p className="text-sm text-red-600 font-medium">Слот 21.03 · День — меньше 9 судей (сейчас 7)</p>
            <p className="text-sm text-red-500 mt-1">Закрыть через вариант А или Б выше</p>
          </div>

          {/* Варианты */}
          <div className="space-y-3 mb-6">
            <div className="border-2 border-black rounded-xl p-4 cursor-pointer relative bg-white shadow-sm">
              <div className="flex items-center gap-2 font-bold mb-1 text-gray-900">
                <div className="w-4 h-4 rounded-full border-2 border-black flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-black"></div>
                </div>
                Вариант А
              </div>
              <p className="text-sm text-gray-700">Попросить задержаться уже зарегистрированных судей</p>
            </div>
            
            <div className="border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors bg-white">
              <div className="flex items-center gap-2 font-bold mb-1 text-gray-700">
                <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                Вариант Б — пригласить новых судей
              </div>
              <p className="text-sm text-gray-500">Вероятность согласия: 78% · рейтинг 1–2</p>
              <p className="text-xs text-gray-400 mt-1">Потребуется 2 приглашения из резерва</p>
            </div>
          </div>

          {/* Кнопки управления */}
          <div className="flex gap-2 mb-6">
            <Button 
              className="flex-grow font-bold" 
              onClick={handleAllocate} 
              disabled={loading}
            >
              {loading ? 'Распределение...' : 'Принять сценарий ИИ'}
            </Button>
            <Button variant="secondary" className="flex items-center gap-2 px-3" onClick={handleAllocate} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/> 
              Пересчитать
            </Button>
          </div>

          {/* Пояснение LLM */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex-grow mb-4">
            <h4 className="font-bold text-sm mb-2 text-gray-700">Пояснение ИИ (LLM)</h4>
            <div className="text-sm text-gray-600 leading-relaxed">
              {aiResult ? (
                <p>{aiResult.justification}</p>
              ) : (
                <p className="text-gray-400 italic">Нажмите «Принять сценарий ИИ», чтобы сгенерировать обоснование распределения.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Подвал */}
      <footer className="bg-white border-t px-6 py-4 flex justify-between items-center sticky bottom-0 z-10">
        <span className="text-sm text-gray-500">Изменений к сохранению: 3</span>
        <Button 
          className="bg-[#1a1f36] hover:bg-[#2a3046] px-6 py-2.5" 
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? 'Синхронизация...' : 'Сохранить и синхронизировать с Django'}
        </Button>
      </footer>
    </div>
  );
}