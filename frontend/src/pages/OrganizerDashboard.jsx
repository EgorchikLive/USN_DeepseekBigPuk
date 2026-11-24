import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button } from '../components/UI';
import { AlertTriangle, Check, Clock, RefreshCw } from 'lucide-react';
import apiClient from '../api/client'; // Убедитесь, что путь правильный

// --- Компоненты внутри файла ---

// Ячейка карты доступности
const SlotCell = ({ status, count, max }) => {
  const statusConfig = {
    success: {
      icon: <Check size={16} />,
      label: 'основные судьи',
      subLabel: '✓ резервный судья',
    },
    warning: {
      icon: <Clock size={16} />,
      label: 'основные судьи',
      subLabel: '⏳ резервный судья',
    },
    danger: {
      icon: <AlertTriangle size={16} />,
      label: 'основные судьи',
      subLabel: '⚠ резервный судья',
    },
  };

  const cfg = statusConfig[status] || statusConfig.success;

  return (
    <div className={`availability-cell ${status}`}>
      <div className="availability-count">
        {cfg.icon}
        <span>{count}/{max}</span>
      </div>
      <span className="availability-label">{cfg.label}</span>
      <div className="availability-reserve">
        {cfg.subLabel}
      </div>
    </div>
  );
};

// --- Основной компонент ---

export default function OrganizerDashboard() {
  const navigate = useNavigate();
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
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/organizer/saved');
    } catch (error) {
      alert("Ошибка синхронизации");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans organizer-dashboard">
      
      {/* Шапка */}
      <header className="organizer-header">
        <div className="organizer-brand">
          <div className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center font-bold text-xs text-gray-400">Logo</div>
          <span>USN · Панель организатора</span>
        </div>
        <div className="organizer-header-actions">
          <div className="organizer-tournament-label">Кубок «Осень-2026» · Классический формат</div>
          <span className="organizer-confirmed-count">Судей подтверждено: <b>27/36</b></span>
          <Badge type="danger" text="Слотов с дефицитом: 2" className="organizer-deficit-badge" />
          <button className="organizer-applications-link" onClick={() => navigate('/judge-applications')}>К заявкам судей <span>→</span></button>
        </div>
      </header>

      {/* Основной контент */}
      <main className="organizer-dashboard-main">
        
        {/* Левая колонка (Карта доступности) */}
        <div className="organizer-panel organizer-availability-panel">
          <div className="organizer-panel-heading">
            <h2>Карта доступности · коллегии судей</h2>
            <div className="organizer-date-switch">
              <button className="organizer-date-button active">21.03</button>
              <button className="organizer-date-button">22.03</button>
            </div>
          </div>

          {/* Легенда */}
          <div className="organizer-legend">
            <div className="organizer-legend-item">
              <span className="organizer-legend-dot success"></span>
              Состав подтвержден
            </div>
            <div className="organizer-legend-item">
              <span className="organizer-legend-dot warning"></span>
              Предложен состав
            </div>
            <div className="organizer-legend-item">
              <span className="organizer-legend-dot danger"></span>
              Не хватает кандидатов
            </div>
          </div>

          {/* Сетка карты */}
          <div className="organizer-map-scroll">
            <table className="organizer-map-table">
              <thead>
                <tr>
                  <th className="organizer-map-label">Коллегия</th>
                  <th>21.03 · утро</th>
                  <th>21.03 · день</th>
                  <th>21.03 · вечер</th>
                  <th>22.03 · утро</th>
                  <th>22.03 · день</th>
                  <th>22.03 · вечер</th>
                </tr>
              </thead>
              <tbody>
                {mapData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <th scope="row" className="organizer-map-row-label">{row.row}</th>
                    {row.slots.map((slot, colIndex) => (
                      <td key={colIndex}>
                        <div 
                          onClick={() => setSelectedSlot({ row: row.row, time: `21.03 · ${colIndex === 0 ? 'утро' : colIndex === 1 ? 'день' : 'вечер'}`, count: slot.c, max: row.max, status: slot.s })}
                          className="organizer-map-cell"
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
          <div className="organizer-selected-slot">
            <div>
                <h4>Выбран слот: 21.03 · День</h4>
                <p>Требуется 9 судей · подтверждено 7 · не хватает 2</p>
                <small>Назначение судей — через ИИ-ассистент</small>
            </div>
            <Badge type="danger" text="дефицит: 2" className="organizer-deficit-badge" />
          </div>
        </div>

        {/* Правая колонка (ИИ-ассистент) */}
        <div className="organizer-panel organizer-assistant-panel">
          <h2>ИИ-ассистент распределения</h2>
          
          {/* Блок дефицита */}
          <div className="organizer-shortage-alert">
            <div>
              <AlertTriangle size={18} />
              Обнаружен дефицит
            </div>
            <p>Слот 21.03 · День — меньше 9 судей (сейчас 7)</p>
            <small>Закрыть через вариант А или Б</small>
          </div>

          {/* Варианты */}
          <div className="organizer-scenarios">
            <div className="organizer-scenario active">
                <div>
                  <span className="organizer-scenario-radio"></span>
                  <strong>Вариант А</strong>
                </div>
                <p>Попросить задержаться уже зарегистрированных судей</p>
            </div>
            
            <div className="organizer-scenario">
                <div>
                  <span className="organizer-scenario-radio"></span>
                  <strong>Вариант Б — пригласить новых судей</strong>
              </div>
                <p>Вероятность согласия: 78% · рейтинг 1–2</p>
                <small>Потребуется 2 приглашения из резерва</small>
            </div>
          </div>

          {/* Кнопки управления */}
          <div className="organizer-assistant-actions">
            <Button 
                className="organizer-ai-button"
              onClick={handleAllocate} 
              disabled={loading}
            >
              {loading ? 'Распределение...' : 'Принять сценарий ИИ'}
            </Button>
            <Button variant="secondary" className="organizer-recalculate-button" onClick={handleAllocate} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/> 
              Пересчитать
            </Button>
          </div>

          {/* Пояснение LLM */}
          <div className="organizer-ai-explanation">
            <h4>Пояснение ИИ (LLM)</h4>
            <div>
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
      <footer className="organizer-dashboard-footer">
        <span>Изменений к сохранению: 3</span>
        <Button 
          className="organizer-sync-button"
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? 'Синхронизация...' : 'Сохранить и синхронизировать с Django'}
        </Button>
      </footer>
    </div>
  );
}