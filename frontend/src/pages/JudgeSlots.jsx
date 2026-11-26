import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { fetchTournament, getSpreadsheetError } from '../api/spreadsheet';

export default function JudgeSlots() {
  const navigate = useNavigate();
  const location = useLocation();
  const tournamentId = location.state?.competitionId || location.state?.tournament?.id;
  const [tournament, setTournament] = useState(location.state?.tournament || null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(Boolean(tournamentId));
  const [error, setError] = useState(
    tournamentId ? '' : 'Сначала выберите турнир из списка Google Sheets.',
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
  const toggle = slotId => {
    setSelected(current => current.includes(slotId)
      ? current.filter(item => item !== slotId)
      : [...current, slotId]);
  };

  return (
    <Layout
      title="USN · Регистрация участника"
      rightContent={
        <span className="header-pill">
          {tournament ? `${tournament.title} · ${tournament.format}` : 'Доступность судьи'}
        </span>
      }
    >
      <div className="registration-shell" style={{ width: 620, paddingTop: 48 }}>
        <div className="back-step">
          <button className="back-link" onClick={() => navigate(-1)}>← К ролям</button>
          <span className="step">Шаг 3 из 3</span>
        </div>
        <div className="slots-card">
          <div className="slots-header">
            <h2>Блок 3 · Доступность по слотам</h2>
            <span>Выбрано слотов: {selected.length} · минимум — 1</span>
          </div>
          {tournament?.dates?.length > 0 && (
            <p className="slots-source-dates">
              Даты турнира: {tournament.dates.join(' · ')}.
              {' '}Дата для каждого слота отдельно не указана.
            </p>
          )}
          {loading && <p className="spreadsheet-state">Загружаем расписание...</p>}
          {error && <p className="spreadsheet-state error" role="alert">{error}</p>}
          {!loading && !error && slots.length === 0 && (
            <p className="spreadsheet-state">В расписании нет игровых слотов.</p>
          )}
          {!loading && !error && slots.length > 0 && (
            <section className="slots-day">
              <h3>Игровые слоты из расписания</h3>
              {slots.map(slot => (
                <div className="slots-row" key={slot.id}>
                  <strong>{slot.phase || 'Этап не указан'}</strong>
                  <div className="slots-list">
                    <button
                      type="button"
                      className={`slot-pill ${selected.includes(slot.id) ? 'selected' : ''}`}
                      aria-pressed={selected.includes(slot.id)}
                      onClick={() => toggle(slot.id)}
                    >
                      <span className="slot-desktop-time">{slot.time}</span>
                      <span className="slot-mobile-time">{slot.time.split(/[–-]/)[0]}</span>
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
        <button
          className="primary-button slots-submit"
          disabled={loading || Boolean(error) || selected.length < 1}
          onClick={() => navigate('/register/review', {
            state: {
              ...location.state,
              role: 'judge',
              tournament,
              slots: selected,
            },
          })}
        >
          Отправить заявку
        </button>
        {selected.length > 0 && (
          <p className="slots-note">Доступность выбрана по слотам из Google Sheets.</p>
        )}
      </div>
    </Layout>
  );
}
