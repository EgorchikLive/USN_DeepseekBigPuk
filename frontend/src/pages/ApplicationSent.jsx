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
        <h1>Заявка отправлена!</h1>
        <div className="sent-pills">
          <span>Статус: получена</span>
          <span>ID заявки: REG-1042</span>
        </div>
        {isJudge && (
          <p className="sent-text">Назначение слотов пройдет после того, как организатор подтвердит составы.<br />Уведомление придет по email после подтверждения.</p>
        )}
        {!isJudge && <p className="sent-text">Уведомление придёт вам на email после подтверждения заявки.</p>}
        <div className="sent-actions">
          <button className="primary-button" onClick={() => navigate('/tournaments')}>На главную</button>
          <button className="primary-button" onClick={() => navigate('/applications')}>Мои заявки</button>
        </div>
      </div>
    </Layout>
  );
}
