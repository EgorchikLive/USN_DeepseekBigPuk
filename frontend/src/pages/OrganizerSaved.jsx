import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function OrganizerSaved() {
  const navigate = useNavigate();
  return (
    <Layout title="Панель организатора">
      <div className="organizer-saved-page">
        <section className="organizer-saved-card">
          <div className="organizer-saved-circle">✓</div>
          <h1>Сохранено и синхронизировано</h1>
          <div className="organizer-saved-list">
            <span>✓ <b>21.03 · Кубок «Осень-2026»</b></span>
            <span>✓ <b>Коллегии назначены</b></span>
            <span>✓ <b>Уведомления судьям отправлены</b></span>
          </div>
          <button className="primary-button" onClick={() => navigate('/organizer/tournaments')}>Вернуться к турнирам</button>
        </section>
        <button className="organizer-saved-back" onClick={() => navigate('/organizer')}>← К предыдущему шагу</button>
      </div>
    </Layout>
  );
}
