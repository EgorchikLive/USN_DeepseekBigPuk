import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function MyApplications() {
  const navigate = useNavigate();

  return (
    <Layout title="USN · Мои заявки">
      <div className="applications-page">
        <section className="applications-empty">
          <h1>Личные заявки</h1>
          <p>
            Google Sheets содержит расписания и ответы судей, но не хранит
            историю заявок текущего пользователя.
          </p>
          <button
            className="primary-button"
            onClick={() => navigate('/tournaments')}
          >
            К турнирам из таблицы
          </button>
        </section>
      </div>
    </Layout>
  );
}
