import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function RegistrationProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, isNew, data } = location.state || {};
  const [profile, setProfile] = useState({
    email: email || data?.email || '',
    phone: data?.phone || '',
    full_name: data?.full_name || '',
    company: data?.company || '',
    position: data?.position || '',
    country: data?.country || '',
    city: data?.city || '',
  });

  const isGreen = !isNew; // Если не новый, значит из БД (зеленый)
  const updateField = field => event => {
    setProfile(current => ({ ...current, [field]: event.target.value }));
  };

  return (
    <Layout 
      title="USN · Регистрация участника" 
      rightContent={<span className="header-pill">{location.state?.tournament ? `${location.state.tournament.title} · ${location.state.tournament.format}` : 'Профиль участника'}</span>}
    >
      <div className="registration-shell" style={{ paddingTop: 48 }}>
        <div className="back-step">
          <button onClick={() => navigate(-1)} className="back-link">← К контактам</button>
          <span className="step">Шаг 2 из 3</span>
        </div>
        <h2 className="block-title">Блок 1 · Идентификация и защита от дублей</h2>
        <div className={`profile-card ${isGreen ? '' : 'new'}`}>
          {isGreen ? (
            <div className="profile-alert success"><span>✔</span><div><strong>Данные загружены из базы</strong><span>Профиль найден — поля заполнены автоматически, проверьте их</span></div></div>
          ) : (
            <div className="profile-alert new"><span>ℹ</span><div><strong>Новая анкета</strong><span>Пользователь не найден — заполните данные вручную</span></div></div>
          )}
          <div className="profile-fields">
            <div className="field"><label>Email</label><input type="email" value={profile.email} onChange={updateField('email')} placeholder="укажите email" /></div>
            <div className="field"><label>Телефон</label><input type="tel" value={profile.phone} onChange={updateField('phone')} placeholder="+7 ___ ___ __ __" /></div>
            <div className="field"><label>ФИО</label><input type="text" value={profile.full_name} onChange={updateField('full_name')} placeholder="фамилия, имя, отчество" /></div>
            <div className="field"><label>Компания</label><input type="text" value={profile.company} onChange={updateField('company')} placeholder="укажите название компании" /></div>
            <div className="field"><label>Должность</label><input type="text" value={profile.position} onChange={updateField('position')} placeholder="укажите вашу должность" /></div>
            <div className="field"><label>Страна</label><input type="text" value={profile.country} onChange={updateField('country')} placeholder="укажите страну" /></div>
            <div className="field"><label>Город</label><input type="text" value={profile.city} onChange={updateField('city')} placeholder="укажите город" /></div>
          </div>
          <button onClick={() => navigate('/register/role', {
            state: {
              email: profile.email,
              competitionId: location.state?.competitionId,
              tournament: location.state?.tournament,
              profile,
            },
          })} className="primary-button" style={{ width: 180 }}>Продолжить</button>
        </div>
      </div>
    </Layout>
  );
}