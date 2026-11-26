import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';

export default function OrganizerSaved() {
  const navigate = useNavigate();
  const location = useLocation();
  const { competitionId = 'classic' } = useParams();
  const returnTo = location.state?.returnTo || `/organizer/tournaments/${competitionId}`;

  return (
    <Layout title="Панель организатора">
      <div className="organizer-saved-page">
        <section className="organizer-saved-card">
          <div className="organizer-saved-circle">✓</div>
          <h1>Сценарий сохранён</h1>
          <div className="organizer-saved-list">
            <span>✓ <b>Сценарий сохранён в текущей сессии браузера</b></span>
            <span>✓ <b>Вы можете вернуться к сетке и продолжить работу</b></span>
          </div>
          <button className="primary-button" onClick={() => navigate('/organizer/tournaments')}>Вернуться к турнирам</button>
        </section>
        <button
          className="organizer-saved-back"
          onClick={() => navigate(returnTo, {
            state: {
              tournament: location.state?.tournament,
              mapData: location.state?.mapData,
              aiResult: location.state?.aiResult,
              selectedSlot: location.state?.selectedSlot,
              selectedSlotId: location.state?.selectedSlotId,
              assignmentOverrides: location.state?.assignmentOverrides,
            },
          })}
        >
          ← К предыдущему шагу
        </button>
      </div>
    </Layout>
  );
}
