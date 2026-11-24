import { useLocation, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function RegistrationCheck() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, competitionId, exists, data } = location.state || {};

  // Если перешли по прямой ссылке, возвращаем на старт
  if (!email) {
    navigate('/tournaments');
    return null;
  }

  return (
    <Layout 
      title="USN · Регистрация участника" 
      rightContent={<span className="header-pill">Название {competitionId || '1'} | {competitionId === '2' ? 'экспресс' : competitionId === '3' ? 'команда' : 'классика'}</span>}
    >
      <div className="registration-shell">
        <div className="back-step">
          <button onClick={() => navigate(-1)} className="back-link">← К контактам</button>
          <span className="step">Шаг 1 из 3</span>
        </div>
        <div className="card check-card">
          <div className="spinner" />
          <h2>Проверяем email и телефон в базе...</h2>
          <p className="subtitle">Ищем совпадения среди анкет прошлых турниров</p>
          <div className="demo-options">
            <button className="demo-option success" onClick={() => navigate('/register/profile', { state: { email, competitionId, isNew: false, data } })}>
              <strong>✓ Демо: найдено в БД</strong>
              поля подгрузятся сами<br />зелёная рамка
            </button>
            <button className="demo-option new" onClick={() => navigate('/register/profile', { state: { email, competitionId, isNew: true, data: {} } })}>
              <strong>Демо: новый пользователь</strong>
              анкета останется пустой<br />синяя рамка
            </button>
            <button className="demo-option" onClick={() => navigate('/register/already')}>
              <strong>Заявка уже есть</strong>
              статус заявки получен
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}