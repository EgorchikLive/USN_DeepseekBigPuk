import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { fetchTournament, getSpreadsheetError } from '../api/spreadsheet';

export default function SlotChanges() {
  const navigate = useNavigate();
  const location = useLocation();
  const tournamentId = location.state?.competitionId || location.state?.tournament?.id;
  const [tournament, setTournament] = useState(location.state?.tournament || null);
  const [selected, setSelected] = useState(location.state?.slots || []);
  const [loading, setLoading] = useState(Boolean(tournamentId));
  const [error, setError] = useState(
    tournamentId ? '' : 'Чтобы изменить слоты, откройте заявку выбранного турнира.',
  );

  useEffect(() => {
    if (!tournamentId) return undefined;
    let active = true;
    fetchTournament(tournamentId)
      .then(data => {
        if (active) {
          setTournament(data);
          setError('');
        }
      })
      .catch(loadError => {
        if (active) setError(getSpreadsheetError(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [tournamentId]);

  const slots = useMemo(
    () => (tournament?.schedule || []).filter(
      slot => slot.match_count > 0 || slot.assigned_judge_count > 0,
    ),
    [tournament],
  );
  const selectedSlots = slots.filter(slot => selected.includes(slot.id));

  const toggleSlot = slotId => {
    setSelected(current => current.includes(slotId)
      ? current.filter(item => item !== slotId)
      : [...current, slotId]);
  };

  const submit = () => {
    navigate('/register/review', {
      state: { ...location.state, tournament, slots: selected },
    });
  };

  return (
    <Layout title="USN · Изменение слотов">
      <div className="slot-change-page">
        <div className="slot-change-layout">
          <aside className="slot-change-side">
            <section>
              <h2>Выбранные слоты:</h2>
              <div className="slot-chip-row">
                {selectedSlots.length ? selectedSlots.map(slot => (
                  <button
                    key={slot.id}
                    type="button"
                    className="slot-chip confirmed selected"
                    onClick={() => toggleSlot(slot.id)}
                  >
                    {slot.time} · {slot.phase || 'этап не указан'} ×
                  </button>
                )) : <span className="spreadsheet-state">Слоты не выбраны</span>}
              </div>
            </section>
            <section>
              <h2>Данные турнира:</h2>
              <p>{tournament?.title || 'Турнир из Google Sheets'}</p>
              <p>{tournament?.dates?.join(' · ') || 'Дата не указана'}</p>
              {tournament?.dates?.length > 1 && (
                <p>В листе нет привязки даты к каждому отдельному слоту.</p>
              )}
            </section>
          </aside>

          <section className="slot-change-card">
            <div className="slot-change-card-header">
              <h2>Доступные слоты</h2>
              <span>Выберите слоты из расписания таблицы</span>
            </div>
            {loading && <p className="spreadsheet-state">Загружаем расписание...</p>}
            {error && <p className="spreadsheet-state error" role="alert">{error}</p>}
            {!loading && !error && slots.length === 0 && (
              <p className="spreadsheet-state">В расписании нет игровых слотов.</p>
            )}
            {!loading && !error && slots.map(slot => (
              <div className="slot-change-row" key={slot.id}>
                <strong>{slot.phase || 'Этап не указан'}</strong>
                <div>
                  <button
                    type="button"
                    className={`slot-change-pill ${selected.includes(slot.id) ? 'selected' : ''}`}
                    aria-pressed={selected.includes(slot.id)}
                    onClick={() => toggleSlot(slot.id)}
                  >
                    {slot.time}
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>
        <button
          className="primary-button slot-change-submit"
          disabled={loading || Boolean(error)}
          onClick={submit}
        >
          Сохранить выбор
        </button>
      </div>
    </Layout>
  );
}
