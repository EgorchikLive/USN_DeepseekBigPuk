import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function RegistrationProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, isNew, data } = location.state || {};

  const isGreen = !isNew; // Если не новый, значит из БД (зеленый)

  return (
    <Layout 
      title="USN · Регистрация участника" 
      rightContent={<span className="header-pill">Название {location.state?.competitionId || '1'} | {location.state?.competitionId === '2' ? 'экспресс' : location.state?.competitionId === '3' ? 'команда' : 'классика'}</span>}
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
            <div className="field"><label>Email</label><input type="email" defaultValue={email || data?.email} placeholder="укажите email" /></div>
            <div className="field"><label>Телефон</label><input type="tel" defaultValue={data?.phone || ''} placeholder="+7 ___ ___ __ __" /></div>
            <div className="field"><label>ФИО</label><input type="text" defaultValue={data?.full_name || ''} placeholder="фамилия, имя, отчество" /></div>
            <div className="field"><label>Компания</label><input type="text" defaultValue={data?.company || ''} placeholder="укажите название компании" /></div>
            <div className="field"><label>Должность</label><input type="text" defaultValue={data?.position || ''} placeholder="укажите вашу должность" /></div>
            <div className="field"><label>Страна</label><input type="text" defaultValue={data?.country || ''} placeholder="укажите страну" /></div>
            <div className="field"><label>Город</label><input type="text" defaultValue={data?.city || ''} placeholder="укажите город" /></div>
          </div>
          <button onClick={() => navigate('/register/role', { state: { email, competitionId: location.state?.competitionId } })} className="primary-button" style={{ width: 180 }}>Продолжить</button>
        </div>
      </div>
    </Layout>
  );
}