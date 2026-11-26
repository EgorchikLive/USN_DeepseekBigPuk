import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  fetchJudgeApplications,
  fetchTournament,
  getSpreadsheetError,
} from '../api/spreadsheet';

export default function JudgeApplications() {
  const navigate = useNavigate();
  const location = useLocation();
  const { competitionId } = useParams();
  const [applications, setApplications] = useState([]);
  const [tournament, setTournament] = useState(location.state?.tournament || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const organizerPath = location.state?.returnTo || (
    competitionId
      ? `/organizer/tournaments/${competitionId}`
      : '/organizer/tournaments'
  );

  useEffect(() => {
    let active = true;
    const requests = [fetchJudgeApplications(competitionId)];
    if (competitionId) requests.push(fetchTournament(competitionId));

    Promise.all(requests)
      .then(([items, tournamentData]) => {
        if (!active) return;
        setApplications(items);
        setError('');
        if (tournamentData) setTournament(tournamentData);
      })
      .catch(loadError => {
        if (active) setError(getSpreadsheetError(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [competitionId]);

  const groupedApplications = useMemo(() => {
    const groups = new Map();
    for (const application of applications) {
      const title = application.tournament_title || tournament?.title || 'Турнир из таблицы';
      if (!groups.has(title)) groups.set(title, []);
      groups.get(title).push(application);
    }
    return [...groups.entries()];
  }, [applications, tournament]);

  return (
    <Layout title="USN · Ответы судей">
      <div className="judge-applications-page">
        <div className="judge-applications-toolbar">
          <button onClick={() => navigate(organizerPath)}>← Назад</button>
          <span>Ответы из таблицы · {applications.length}</span>
        </div>
        {tournament && (
          <p className="judge-applications-tournament">
            {tournament.title} · {tournament.format}
          </p>
        )}
        {loading && <p className="spreadsheet-state">Загружаем ответы судей...</p>}
        {error && <p className="spreadsheet-state error" role="alert">{error}</p>}
        {!loading && !error && applications.length === 0 && (
          <p className="spreadsheet-state">В таблице нет ответов судей для этого турнира.</p>
        )}
        {!loading && !error && groupedApplications.map(([title, rows]) => (
          <section className="judge-application-group" key={title}>
            <h2>{title} · {rows.length}</h2>
            {rows.map(application => (
              <button
                className="judge-application-row"
                key={application.id}
                onClick={() => navigate(
                  competitionId
                    ? `/organizer/tournaments/${competitionId}/applications/${encodeURIComponent(application.id)}`
                    : `/judge-applications/${encodeURIComponent(application.id)}`,
                  {
                    state: {
                      application,
                      tournament,
                      returnTo: location.pathname,
                    },
                  },
                )}
              >
                <strong>{application.judge_id}</strong>
                <span>
                  {[application.city, application.club].filter(Boolean).join(' · ') || 'Профиль не заполнен'}
                  {' · доступность: '}{application.availability.length}
                </span>
                <b className="judge-status new">Ответ получен</b>
              </button>
            ))}
          </section>
        ))}
      </div>
    </Layout>
  );
}
