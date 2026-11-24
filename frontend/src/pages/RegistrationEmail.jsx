import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client'; // Подключаем наш Axios

export default function RegistrationEmail() {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Отправляем запрос на бэкенд для проверки
      const res = await api.post('/registration/check-email', {
        email,
        competition_id: competitionId
      });
      // Переходим на экран проверки, передавая данные
      navigate('/register/check', { state: { email, competitionId, exists: res.data.exists, data: res.data.registration } });
    } catch (error) {
      console.error(error);
      alert("Ошибка при проверке email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout 
      title="USN · Регистрация участника" 
      rightContent={<span className="header-pill">Название {competitionId} | {competitionId === '2' ? 'экспресс' : competitionId === '3' ? 'команда' : 'классика'}</span>}
    >
      <div className="registration-shell">
        <div className="back-step">
          <Link to="/tournaments" className="back-link">← Старт</Link>
          <span className="step">Шаг 1 из 3</span>
        </div>
        <h2 className="block-title">Блок 1 · Идентификация и защита от дублей</h2>
        <form onSubmit={handleSubmit} className="registration-email">
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="укажите email для проверки в базе" required />
          </div>
          <button type="submit" disabled={loading} className="primary-button">{loading ? 'Проверка...' : 'Продолжить'}</button>
        </form>
      </div>
    </Layout>
  );
}