import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function AlreadyRegistered() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tournament, data } = location.state || {};
  return (
    <Layout title="USN · Регистрация участника" rightContent={<span className="header-pill">{tournament ? `${tournament.title} · ${tournament.format}` : 'Заявка'}</span>}>
      <div className="registration-shell" style={{ paddingTop: 48 }}>
        <div className="back-step">
          <button className="back-link" onClick={() => navigate(-1)}>← К контактам</button>
          <span className="step">Шаг 1 из 3</span>
        </div>
        <div className="card already-card">
          <div className="success-circle">✓</div>
          <h2>У вас уже есть заявка на этот турнир</h2>
          <div className="status-pills">
            <span>ID заявки: {data?.id || 'не указан'}</span>
            <span>статус заявки: {data?.status || 'не указан'}</span>
          </div>
          <button className="primary-button" style={{ width: 220 }} onClick={() => navigate('/applications')}>Мои заявки</button>
        </div>
      </div>
    </Layout>
  );
}