import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function AlreadyRegistered() {
  const navigate = useNavigate();
  const location = useLocation();
  const competitionId = location.state?.competitionId;
  const format = competitionId === '2' ? 'экспресс' : competitionId === '3' ? 'команда' : 'классика';
  return (
    <Layout title="USN · Регистрация участника" rightContent={<span className="header-pill">Название {competitionId || '1'} | {format}</span>}>
      <div className="registration-shell" style={{ paddingTop: 48 }}>
        <div className="back-step">
          <button className="back-link" onClick={() => navigate(-1)}>← К контактам</button>
          <span className="step">Шаг 1 из 3</span>
        </div>
        <div className="card already-card">
          <div className="success-circle">✓</div>
          <h2>У вас уже есть заявка на этот турнир</h2>
          <div className="status-pills">
            <span>ID заявки: REG-1042</span>
            <span>статус заявки: получена</span>
          </div>
          <button className="primary-button" style={{ width: 220 }} onClick={() => navigate('/applications')}>Мои заявки</button>
        </div>
      </div>
    </Layout>
  );
}