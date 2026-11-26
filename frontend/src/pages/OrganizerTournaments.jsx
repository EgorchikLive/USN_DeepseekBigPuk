import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { fetchTournaments, getSpreadsheetError } from '../api/spreadsheet';

export default function OrganizerTournaments() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchTournaments()
      .then(items => {
        if (active) setTournaments(items);
      })
      .catch(loadError => {
        if (active) setError(getSpreadsheetError(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  return (
    <Layout title="USN">
      <div className="organizer-tournaments">
        <h1>Список турниров</h1>
        {loading && <p className="spreadsheet-state">Загружаем турниры из таблицы...</p>}
        {error && <p className="spreadsheet-state error" role="alert">{error}</p>}
        {!loading && !error && tournaments.length === 0 && (
          <p className="spreadsheet-state">В таблице не найдены турниры.</p>
        )}
        {!loading && !error && tournaments.length > 0 && (
          <div className="organizer-tournament-grid">
            {tournaments.map(item => (
              <article className="organizer-tournament-card" key={item.id}>
                <h2>{item.title}</h2>
                <span className="organizer-format">{item.format}</span>
                <p>{item.dates.length ? item.dates.join(' · ') : 'Дата не указана'}</p>
                <div className="organizer-count">
                  <span>по данным таблицы</span>
                  <b>слотов расписания · {item.schedule_slot_count}</b>
                  <b>ответов судей · {item.judge_application_count}</b>
                </div>
                {item.problematic_slots && (
                  <details className="organizer-tournament-note">
                    <summary>Заметка из таблицы</summary>
                    <p>{item.problematic_slots}</p>
                  </details>
                )}
                <button
                  className="primary-button"
                  onClick={() => navigate(`/organizer/tournaments/${encodeURIComponent(item.id)}`)}
                >
                  Перейти
                </button>
              </article>
            ))}
          </div>
        )}
        <button className="organizer-back" onClick={() => navigate('/')}>← К старту</button>
      </div>
    </Layout>
  );
}
