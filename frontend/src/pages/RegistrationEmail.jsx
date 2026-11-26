import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client'; // Подключаем наш Axios
import { fetchTournament, getSpreadsheetError } from '../api/spreadsheet';

export default function RegistrationEmail() {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTournament, setLoadingTournament] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchTournament(competitionId)
      .then(data => {
        if (active) {
          setTournament(data);
          setError('');
        }
      })
      .catch(loadError => {
        if (active) setError(getSpreadsheetError(loadError));
      })
      .finally(() => {
        if (active) setLoadingTournament(false);
      });

    return () => { active = false; };
  }, [competitionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/registration/check-email', {
        email,
        competition_id: competitionId
      });
      navigate('/register/check', {
        state: {
          email,
          competitionId,
          tournament,
          exists: res.data.exists,
          data: res.data.registration,
        },
      });
    } catch (error) {
      setError(getSpreadsheetError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout 
      title="USN · Регистрация участника" 
      rightContent={<span className="header-pill">{tournament ? `${tournament.title} · ${tournament.format}` : 'Турнир из таблицы'}</span>}
    >
      <div className="registration-shell">
        <div className="back-step">
          <Link to="/tournaments" className="back-link">← Старт</Link>
          <span className="step">Шаг 1 из 3</span>
        </div>
        <h2 className="block-title">Блок 1 · Идентификация и защита от дублей</h2>
        {loadingTournament && <p className="spreadsheet-state">Загружаем данные турнира...</p>}
        {error && <p className="spreadsheet-state error" role="alert">{error}</p>}
        <form onSubmit={handleSubmit} className="registration-email">
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="укажите email для проверки в базе" required />
          </div>
          <button type="submit" disabled={loading || loadingTournament || !tournament} className="primary-button">{loading ? 'Проверка...' : 'Продолжить'}</button>
        </form>
      </div>
    </Layout>
  );
}