import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const tournaments = [
  { id: 'classic', title: 'Кубок «Осень-2026»', format: 'классика', date: '21 марта 2026', newApplications: 'судья · 1', players: 'игрок · 1', deficit: 'судья · 1' },
  { id: 'express', title: 'Кубок «Осень-2026»', format: 'экспресс', date: '22 марта 2026', newApplications: 'судья · 1', players: 'игрок · 1' },
  { id: 'team', title: 'Кубок «Осень-2026»', format: 'команда', date: '21 марта 2026', newApplications: 'судья · 0', players: 'игрок · 0', active: false },
];

export default function OrganizerTournaments() {
  const navigate = useNavigate();
  return (
    <Layout title="USN">
      <div className="organizer-tournaments">
        <h1>Список турниров</h1>
        <div className="organizer-tournament-grid">
          {tournaments.map((item) => (
            <article className={`organizer-tournament-card ${item.active === false ? 'disabled' : ''}`} key={item.id}>
              <h2>{item.title}</h2>
              <span className="organizer-format">{item.format}</span>
              <p>{item.date}</p>
              <div className="organizer-count">
                <span>новые заявки:</span>
                <b>{item.newApplications}</b>
                {item.players && <b>{item.players}</b>}
              </div>
              {item.deficit && <div className="organizer-deficit">дефицит: <b>{item.deficit}</b></div>}
              <button
                className="primary-button"
                disabled={item.active === false}
                onClick={() => navigate(`/organizer/tournaments/${item.id}`, { state: { tournament: item } })}
              >
                Перейти
              </button>
            </article>
          ))}
        </div>
        <button className="organizer-back" onClick={() => navigate('/')}>← К старту</button>
      </div>
    </Layout>
  );
}
