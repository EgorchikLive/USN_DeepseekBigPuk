import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { fetchJudgeApplication, getSpreadsheetError } from '../api/spreadsheet';

export default function JudgeApplicationDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { applicationId, competitionId } = useParams();
  const [loadedState, setLoadedState] = useState({
    applicationId: null,
    application: null,
    error: '',
  });
  const loading = !location.state?.application
    && loadedState.applicationId !== applicationId;
  const application = location.state?.application
    || (loadedState.applicationId === applicationId ? loadedState.application : null);
  const error = location.state?.application
    ? ''
    : loadedState.applicationId === applicationId
      ? loadedState.error
      : '';
  const tournamentId = competitionId || application?.tournament_id;
  const returnTo = location.state?.returnTo || (
    tournamentId
      ? `/organizer/tournaments/${tournamentId}/applications`
      : '/judge-applications'
  );

  useEffect(() => {
    if (location.state?.application) return undefined;
    let active = true;
    fetchJudgeApplication(applicationId, competitionId)
      .then(data => {
        if (active) {
          setLoadedState({
            applicationId,
            application: data,
            error: '',
          });
        }
      })
      .catch(loadError => {
        if (active) {
          setLoadedState({
            applicationId,
            application: null,
            error: getSpreadsheetError(loadError),
          });
        }
      });

    return () => { active = false; };
  }, [applicationId, competitionId, location.state]);

  return (
    <Layout title="USN · Ответ судьи">
      <div className="judge-detail-page">
        <button className="judge-detail-back" onClick={() => navigate(returnTo)}>
          ← К ответам
        </button>
        {loading && <p className="spreadsheet-state">Загружаем ответ из таблицы...</p>}
        {error && <p className="spreadsheet-state error" role="alert">{error}</p>}
        {!loading && !error && application && (
          <>
            <p className="judge-detail-tournament">
              {application.tournament_title} · {application.tournament_format}
              {application.tournament_dates?.length
                ? ` · ${application.tournament_dates.join(' · ')}`
                : ''}
            </p>
            <div className="judge-detail-layout">
              <section className="judge-personal">
                <h2>Данные из ответа</h2>
                <ReadOnlyField label="ID судьи" value={application.judge_id} />
                <ReadOnlyField label="Город" value={application.city} />
                <ReadOnlyField label="Клуб / школа" value={application.club} />
                <div className="judge-introduction">
                  <span>Представление участникам</span>
                  <p>{application.introduction || 'Не указано в таблице'}</p>
                </div>
              </section>

              <section className="judge-detail-slots">
                <h2>Доступность по слотам</h2>
                {application.availability.length ? (
                  application.availability.map((item, index) => (
                    <article className="judge-availability-response" key={`${item.period}-${index}`}>
                      <strong>{item.period}</strong>
                      <span>{item.answer}</span>
                    </article>
                  ))
                ) : (
                  <p className="spreadsheet-state">Ответы о доступности не заполнены.</p>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="judge-field">
      <span>{label}</span>
      <div className="judge-readonly-value">{value || 'Не указано в таблице'}</div>
    </div>
  );
}
