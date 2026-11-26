import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function RegistrationCheck() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, competitionId, tournament, exists = false, data } = location.state || {};

  // Если перешли по прямой ссылке, возвращаем на старт
  if (!email) {
    navigate('/tournaments');
    return null;
  }

  return (
    <Layout 
      title="USN · Регистрация участника" 
      rightContent={<span className="header-pill">{tournament ? `${tournament.title} · ${tournament.format}` : 'Проверка участника'}</span>}
    >
      <div className="registration-shell">
        <div className="back-step">
          <button onClick={() => navigate(-1)} className="back-link">← К контактам</button>
          <span className="step">Шаг 1 из 3</span>
        </div>
        <div className="card check-card">
          <div className="spinner" />
          <h2>{exists ? 'Профиль найден' : 'Профиль не найден'}</h2>
          <p className="subtitle">
            {exists
              ? 'Для этого турнира уже есть сохранённые данные.'
              : 'Можно продолжить с новой анкетой.'}
          </p>
          <div className="demo-options">
            {exists ? (
              <>
                <button className="demo-option success" onClick={() => navigate('/register/profile', {
                  state: { email, competitionId, tournament, isNew: false, data },
                })}>
                  <strong>Продолжить с найденным профилем</strong>
                  проверьте загруженные поля
                </button>
                <button className="demo-option" onClick={() => navigate('/register/already', {
                  state: { competitionId, tournament, data },
                })}>
                  <strong>Перейти к существующей заявке</strong>
                  статус из базы регистрации
                </button>
              </>
            ) : (
              <button className="demo-option new" onClick={() => navigate('/register/profile', {
                state: { email, competitionId, tournament, isNew: true, data: {} },
              })}>
                <strong>Заполнить новую анкету</strong>
                данные профиля будут введены вручную
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}