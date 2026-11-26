import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { fetchTournaments, getSpreadsheetError } from '../api/spreadsheet';

export default function TournamentsList() {
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
      <div className="tournament-page">
        <div className="tournament-heading">
          <h1>Список турниров</h1>
          <p>Расписания и данные турниров из Google Sheets</p>
        </div>
        {loading && <p className="spreadsheet-state">Загружаем турниры из таблицы...</p>}
        {error && <p className="spreadsheet-state error" role="alert">{error}</p>}
        {!loading && !error && tournaments.length === 0 && (
          <p className="spreadsheet-state">В таблице не найдены турниры.</p>
        )}
        {!loading && !error && tournaments.length > 0 && (
          <div className="tournament-grid">
            {tournaments.map(tournament => (
              <article key={tournament.id} className="tournament-card">
                <h2>{tournament.title}</h2>
                <span className="format-pill">{tournament.format}</span>
                <p className="tournament-desc">Лист: {tournament.source_sheet}</p>
                <p className="tournament-date">
                  {tournament.dates.length ? tournament.dates.join(' · ') : 'Дата не указана'}
                </p>
                <div className="tournament-roles">
                  <div className="role-pills">
                    <span>слотов расписания · {tournament.schedule_slot_count}</span>
                    <span>ответов судей · {tournament.judge_application_count}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/register/${encodeURIComponent(tournament.id)}`, {
                    state: { tournament },
                  })}
                  className="primary-button"
                >
                  Открыть
                </button>
              </article>
            ))}
          </div>
        )}
        <div className="tournament-footer">
          <Link to="/"><strong>← К старту</strong></Link>
          <span>Источник данных: Google Sheets</span>
        </div>
      </div>
    </Layout>
  );
}