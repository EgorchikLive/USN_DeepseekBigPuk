import React, { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button } from '../components/UI';
import { AlertTriangle, Check, Clock, RefreshCw } from 'lucide-react';
import apiClient from '../api/client';

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

const rounds = ['утро', 'день', 'вечер'];
const initialMapData = [
  { row: 'Инвесторы', max: 9, slots: [ { s: 'warning', c: 8 }, { s: 'danger', c: 7 }, { s: 'success', c: 9 }, { s: 'success', c: 9 }, { s: 'success', c: 9 }, { s: 'success', c: 9 } ] },
  { row: 'Авторы', max: 3, slots: [ { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 } ] },
  { row: 'Кадры', max: 3, slots: [ { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 }, { s: 'success', c: 3 } ] },
];

function getSlotFromId(slotId) {
  const [rowIndex, dateIndex, roundIndex] = (slotId || '').split('-').map(Number);
  const row = initialMapData[rowIndex];
  if (!row || ![1, 2].includes(dateIndex) || !rounds[roundIndex]) return null;

  const slot = row.slots[(dateIndex - 1) * rounds.length + roundIndex];
  return {
    committee: row.row,
    date: dateIndex === 1 ? '21.03' : '22.03',
    round: rounds[roundIndex],
    required_judges: row.max,
    confirmed_judges: slot.c,
    status: slot.s,
  };
}

function buildAllocationSlots(mapData) {
  return mapData.flatMap((row) => row.slots.map((slot, index) => ({
    committee: row.row,
    date: index < 3 ? '21.03' : '22.03',
    round: rounds[index % 3],
    required_judges: row.max,
    confirmed_judges: slot.c,
  })));
}

function applyAllocationMatrix(mapData, matrix) {
  const slotsByKey = new Map(matrix.map((slot) => [
    `${slot.committee}|${slot.date}|${slot.round}`,
    slot,
  ]));
  return mapData.map((row) => ({
    ...row,
    slots: row.slots.map((slot, index) => {
      const date = index < 3 ? '21.03' : '22.03';
      const result = slotsByKey.get(`${row.row}|${date}|${rounds[index % 3]}`);
      return result
        ? {
            ...slot,
            c: result.confirmed_judges,
            s: result.deficit ? 'danger' : 'success',
          }
        : slot;
    }),
  }));
}

// --- Основной компонент ---

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { competitionId = 'classic', slotId } = useParams();
  const initialSelectedSlot = location.state?.selectedSlot || getSlotFromId(slotId);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(location.state?.aiResult || null);
  const [aiError, setAiError] = useState(location.state?.aiError || '');
  const [selectedSlot, setSelectedSlot] = useState(initialSelectedSlot);
  const [selectedDate, setSelectedDate] = useState(initialSelectedSlot?.date || '21.03');
  const [isSyncing, setIsSyncing] = useState(false);
  const [mapData, setMapData] = useState(() => {
    const data = location.state?.mapData || initialMapData.map((row) => ({
      ...row,
      slots: row.slots.map((slot) => ({ ...slot })),
    }));
    return location.state?.aiResult?.matrix
      ? applyAllocationMatrix(data, location.state.aiResult.matrix)
      : data;
  });
  const tournament = location.state?.tournament || {
    title: 'Кубок «Осень-2026»',
    format: competitionId === 'express' ? 'экспресс' : 'классика',
    date: competitionId === 'express' ? '22 марта 2026' : '21 марта 2026',
  };
  const competitionUuid = competitionId === 'express'
    ? '00000000-0000-0000-0000-000000000002'
    : '00000000-0000-0000-0000-000000000001';
  const totals = mapData.reduce((result, row) => {
    result.required += row.max * row.slots.length;
    result.confirmed += row.slots.reduce((sum, slot) => sum + slot.c, 0);
    result.deficitSlots += row.slots.filter((slot) => slot.c < row.max).length;
    return result;
  }, { required: 0, confirmed: 0, deficitSlots: 0 });

  const handleAllocate = useCallback(async (action = 'analyze') => {
    setLoading(true);
    setAiError('');
    setAiResult(null);
    try {
      const response = await apiClient.post('/allocate', {
        competition_id: competitionUuid,
        action,
        slots: buildAllocationSlots(mapData),
        selected_slot: selectedSlot ? {
          committee: selectedSlot.committee,
          date: selectedSlot.date,
          round: selectedSlot.round,
          required_judges: selectedSlot.required_judges,
          confirmed_judges: selectedSlot.confirmed_judges,
        } : null,
      });
      setAiResult(response.data);
      setMapData((current) => applyAllocationMatrix(current, response.data.matrix));
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') {
        setAiError(detail);
      } else if (error.response?.status) {
        setAiError(`Ошибка API (${error.response.status}). Проверьте настройки LLM и backend.`);
      } else {
        setAiError('Backend недоступен. Запустите FastAPI из папки backend на порту 8000.');
      }
    } finally {
      setLoading(false);
    }
  }, [competitionUuid, mapData, selectedSlot]);

  const handleSave = () => {
    setIsSyncing(true);
    try {
      window.sessionStorage.setItem(
        'usn-organizer-allocation',
        JSON.stringify({ competitionId, mapData, aiResult }),
      );
      navigate(`/organizer/tournaments/${competitionId}/saved`, {
        state: {
          tournament,
          mapData,
          aiResult,
          selectedSlot,
          returnTo: location.pathname,
        },
      });
    } catch {
      setAiError('Не удалось сохранить сценарий в текущей сессии браузера.');
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
          <div className="organizer-tournament-label">{tournament.title} · {tournament.format}</div>
          <span className="organizer-confirmed-count">Судей подтверждено: <b>{totals.confirmed}/{totals.required}</b></span>
          <Badge type="danger" text={`Слотов с дефицитом: ${totals.deficitSlots}`} className="organizer-deficit-badge" />
          <button
            className="organizer-applications-link"
            onClick={() => navigate(`/organizer/tournaments/${competitionId}/applications`, {
              state: {
                tournament,
                selectedSlot,
                mapData,
                allocationSlots: buildAllocationSlots(mapData),
                returnTo: location.pathname,
              },
            })}
          >
            К заявкам судей <span>→</span>
          </button>
        </div>
      </header>

      {/* Основной контент */}
      {location.state?.applicationUpdated && (
        <p className="organizer-flow-notice" role="status">
          Ответ по заявке сохранен. Сетка пересчитывается.
        </p>
      )}
      <main className="organizer-dashboard-main">
        
        {/* Левая колонка (Карта доступности) */}
        <div className="organizer-panel organizer-availability-panel">
          <div className="organizer-panel-heading">
            <h2>{tournament.date} · Карта доступности</h2>
            <div className="organizer-date-switch">
              {['21.03', '22.03'].map((date) => (
                <button
                  key={date}
                  className={`organizer-date-button${selectedDate === date ? ' active' : ''}`}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                    setAiResult(null);
                    setAiError('');
                    navigate(`/organizer/tournaments/${competitionId}`, {
                      replace: true,
                      state: { tournament, mapData },
                    });
                  }}
                >
                  {date}
                </button>
              ))}
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
                  {rounds.map((round) => <th key={round}>{selectedDate} · {round}</th>)}
                </tr>
              </thead>
              <tbody>
                {mapData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <th scope="row" className="organizer-map-row-label">{row.row}</th>
                    {row.slots.map((slot, colIndex) => {
                      const date = colIndex < 3 ? '21.03' : '22.03';
                      if (date !== selectedDate) return null;
                      const round = rounds[colIndex % 3];
                      const isSelected = selectedSlot?.committee === row.row
                        && selectedSlot.date === date
                        && selectedSlot.round === round;

                      return (
                      <td key={colIndex}>
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => {
                            const nextSelectedSlot = {
                              committee: row.row,
                              date,
                              round,
                              required_judges: row.max,
                              confirmed_judges: slot.c,
                              status: slot.s,
                            };
                            const nextSlotId = `${rowIndex}-${date === '21.03' ? 1 : 2}-${colIndex % 3}`;
                            setSelectedSlot(nextSelectedSlot);
                            setAiResult(null);
                            setAiError('');
                            navigate(
                              `/organizer/tournaments/${competitionId}/slots/${nextSlotId}`,
                              { state: { tournament, selectedSlot: nextSelectedSlot, mapData } },
                            );
                          }}
                          className={`organizer-map-cell${isSelected ? ' selected' : ''}`}
                        >
                          <SlotCell status={slot.s} count={slot.c} max={row.max} />
                        </button>
                      </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Блок выбранного слота */}
          <div className="organizer-selected-slot">
            <div>
              {selectedSlot ? (
                <>
                  <h4>Выбран слот: {selectedSlot.date} · {selectedSlot.round} · {selectedSlot.committee}</h4>
                  <p>
                    Требуется {selectedSlot.required_judges} судей · подтверждено {selectedSlot.confirmed_judges}
                    {' · не хватает '}{Math.max(selectedSlot.required_judges - selectedSlot.confirmed_judges, 0)}
                  </p>
                  <small>Запустите анализ, чтобы получить пояснение для выбранного слота.</small>
                </>
              ) : (
                <>
                  <h4>Слот не выбран</h4>
                  <p>Выберите ячейку карты, чтобы увидеть детали и запросить пояснение ИИ.</p>
                </>
              )}
            </div>
            {selectedSlot && (
              <Badge
                type={selectedSlot.confirmed_judges < selectedSlot.required_judges ? 'danger' : 'success'}
                text={`дефицит: ${Math.max(selectedSlot.required_judges - selectedSlot.confirmed_judges, 0)}`}
                className="organizer-deficit-badge"
              />
            )}
          </div>
        </div>

        {/* Правая колонка (ИИ-ассистент) */}
        <div className="organizer-panel organizer-assistant-panel">
          <h2>ИИ-ассистент распределения</h2>
          
          {/* Блок дефицита */}
          <div className="organizer-shortage-alert">
            <div>
              <AlertTriangle size={18} />
              {selectedSlot
                ? (selectedSlot.confirmed_judges < selectedSlot.required_judges ? 'Обнаружен дефицит' : 'Слот укомплектован')
                : 'Выберите слот'}
            </div>
            <p>
              {selectedSlot
                ? `${selectedSlot.date} · ${selectedSlot.round} · ${selectedSlot.committee}: ${selectedSlot.confirmed_judges}/${selectedSlot.required_judges}`
                : 'Нажмите на слот в карте доступности.'}
            </p>
            <small>Рекомендации и перерасчет выполняются по текущим данным сетки.</small>
          </div>

          <div className="organizer-scenarios">
            <p>Для детального пояснения выберите слот. Для пересчета сетки используется число подтвержденных судей по каждому слоту.</p>
          </div>

          {/* Кнопки управления */}
          <div className="organizer-assistant-actions">
            <Button 
              className="organizer-ai-button"
              onClick={() => handleAllocate('analyze')}
              disabled={loading || !selectedSlot}
            >
              {loading ? 'Запрашиваем анализ...' : 'Получить анализ ИИ'}
            </Button>
            <Button variant="secondary" className="organizer-recalculate-button" onClick={() => handleAllocate('recalculate')} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/> 
              Пересчитать сетку
            </Button>
          </div>

          {/* Пояснение LLM */}
          <div className="organizer-ai-explanation">
            <h4>Пояснение ИИ (LLM)</h4>
            <div>
              {aiResult ? (
                <p className="organizer-ai-result">{aiResult.justification}</p>
              ) : aiError ? (
                <p className="organizer-ai-error" role="alert">{aiError}</p>
              ) : loading ? (
                <p>Проверяем дефициты по слотам и сравниваем с агрегированными оценками из таблицы.</p>
              ) : (
                <p className="organizer-ai-hint">Выберите слот для подробной информации или пересчитайте всю сетку.</p>
              )}
              {aiResult?.summary && (
                <p className="organizer-ai-summary">
                  Дефицитных слотов: {aiResult.summary.shortage_slots}; не хватает мест: {aiResult.summary.unfilled_positions}.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Подвал */}
      <footer className="organizer-dashboard-footer">
        <button className="organizer-dashboard-back" onClick={() => navigate('/organizer/tournaments')}>← К турнирам</button>
        <Button 
          className="organizer-sync-button"
          onClick={handleSave}
          disabled={isSyncing}
        >
          {isSyncing ? 'Сохраняем...' : 'Сохранить сценарий'}
        </Button>
      </footer>
    </div>
  );
}