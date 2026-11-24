import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const applications = [
  ['Название 1', 'классика', '22 марта 2026', 'Игрок'],
  ['Название 1', 'классика', '22 марта 2026', 'Секундант'],
  ['Название 1', 'классика', '22 марта 2026', 'Игрок', 'Секундант'],
  ['Название 1', 'классика', '22 марта 2026', 'Зритель'],
  ['Название 2', 'экспресс', '22 марта 2026', 'Игрок'],
  ['Название 2', 'экспресс', '22 марта 2026', 'Судья'],
  ['Название 3', 'команда', '22 марта 2026', 'Игрок'],
  ['Название 3', 'команда', '22 марта 2026', 'Судья'],
];

export default function MyApplications() {
  const navigate = useNavigate();
  return (
    <Layout title="USN · Мои заявки (Прототип)" rightContent="кликабельный прототип">
      <div className="applications-page">
        {applications.map((item, index) => (
          <button className="application-row" key={index} onClick={() => navigate('/register/review', { state: { competitionId: item[1] === 'команда' ? '3' : item[1] === 'экспресс' ? '2' : '1', role: item[3]?.toLowerCase() } })}>
            <strong>{item[0]}</strong>
            <span className="application-meta">{item[1]} · {item[2]}</span>
            <span className="application-role-label">Роль:</span>
            <span className="application-role">{item[3]}</span>
            {item[4] && <span className="application-role">{item[4]}</span>}
            <span className="application-status-label">Статус:</span>
            <span className="application-status">получена</span>
          </button>
        ))}
        <button className="primary-button applications-back" onClick={() => navigate('/')}>К демо-старту</button>
      </div>
    </Layout>
  );
}
