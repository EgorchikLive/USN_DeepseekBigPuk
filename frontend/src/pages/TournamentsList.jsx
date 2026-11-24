import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function TournamentsList() {
  const navigate = useNavigate();

  const tournaments = [
    { id: '1', title: 'Название 1', format: 'классика', date: '21 марта 2026', roles: ['судья · 1', 'участник · 2'], active: true },
    { id: '2', title: 'Название 2', format: 'экспресс', date: '22 марта 2026', roles: ['судья · 1', 'участник · 2'], active: true },
    { id: '3', title: 'Название 3', format: 'командный', date: '9 ноября 2026', roles: ['игрок · 4', 'судья · 2'], active: true },
  ];

  return (
    <Layout title="USN">
      <div className="tournament-page">
        <div className="tournament-heading">
          <h1>Список турниров</h1>
          <p>Выберите турнир, в котором хотели бы поучаствовать</p>
        </div>
        <div className="tournament-grid">
          {tournaments.map((t) => (
            <div key={t.id} className={`tournament-card ${t.active ? '' : 'disabled'}`}>
              <h2>{t.title}</h2>
              <span className="format-pill">{t.format}</span>
              <p className="tournament-desc">описание</p>
              <p className="tournament-date">{t.date}</p>
              <div className="tournament-roles">
                {t.roles.length ? 'открытые роли:' : 'нет доступных ролей'}
                {t.roles.length > 0 && <div className="role-pills">{t.roles.map(r => <span key={r}>{r}</span>)}</div>}
              </div>
              <button disabled={!t.active} onClick={() => navigate(`/register/${t.id}`)} className="primary-button">Перейти</button>
            </div>
          ))}
        </div>
        <div className="tournament-footer">
          <Link to="/"><strong>← (Прототип) К старту</strong></Link>
          <span>Стек: USN (Django) · FastAPI · ИИ-распределение судей · PostgreSQL</span>
        </div>
      </div>
    </Layout>
  );
}