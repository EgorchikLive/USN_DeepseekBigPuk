import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function StartScreen() {
  const navigate = useNavigate();

  return (
    <Layout title="USN - Демо-старт">
      <div className="start-page">
        <div className="start-title">
          <h1>Кто вы на турнире?</h1>
          <p>Выберите роль — дальше прототип ветвится по сценарию</p>
        </div>
        <div className="start-grid">
          <div className="start-card">
            <div className="start-icon">♙</div>
            <h2>Участник</h2>
            <p>Регистрация, проверка дублей,<br />выбор роли и слоты доступности</p>
            <button className="primary-button" onClick={() => navigate('/tournaments')}>Начать регистрацию</button>
          </div>
          <div className="start-card">
            <div className="start-icon">▱</div>
            <h2>Организатор</h2>
            <p>Карта доступности коллегий,<br />ИИ-распределение судей по слотам</p>
            <button className="primary-button" onClick={() => navigate('/organizer/tournaments')}>Открыть панель организатора</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}