import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function ApplicationSent() {
  const navigate = useNavigate();
  const location = useLocation();
  const isJudge = location.state?.role === 'judge';

  return (
    <Layout title="USN">
      <div className="sent-page">
        <div className="sent-circle">✓</div>
        <h1>Форма подготовлена</h1>
        <div className="sent-pills">
          <span>Расписание загружено из Google Sheets</span>
        </div>
        <p className="sent-text">
          {isJudge
            ? 'Выбранные слоты пока не записываются обратно в таблицу: её данные используются только для чтения.'
            : 'Отправка заявок участников в Google Sheets пока не подключена.'}
        </p>
        <div className="sent-actions">
          <button className="primary-button" onClick={() => navigate('/tournaments')}>На главную</button>
          <button className="primary-button" onClick={() => navigate('/applications')}>Мои заявки</button>
        </div>
      </div>
    </Layout>
  );
}
