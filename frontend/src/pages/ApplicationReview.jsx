import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function ApplicationReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const tournament = state.tournament;
  const profile = state.profile || {};
  const format = tournament?.format || 'Формат не указан';
  const roleLabels = { adviser: 'Секундант', player: 'Игрок', viewer: 'Зритель', judge: 'Судья' };
  const roleLabel = roleLabels[state.role] || 'Игрок';
  const teamRole = format.toLowerCase().includes('команд');

  return (
    <Layout title="USN" rightContent={tournament?.format || 'Проверка заявки'}>
      <div className="review-page">
        <h1>Проверка заявки</h1>
        <div className="review-layout">
          <aside className="review-side">
            <div className="review-tournament">
              <h2>{tournament?.title || 'Турнир'}</h2>
              <span className="review-format">{format}</span>
              <p>{tournament?.dates?.join(' · ') || 'Дата не указана'}</p>
              <span className="review-role-label">Роль:</span>
              <span className="review-role">{roleLabel}</span>
              {state.role === 'judge' && (
                <div className="review-slots">
                  <span>Слоты:</span>
                  <div>
                    {state.slots?.length
                      ? state.slots.map(slotId => {
                        const slot = tournament?.schedule?.find(item => item.id === slotId);
                        return <span key={slotId}>{slot ? `${slot.time} · ${slot.phase || ''}` : slotId}</span>;
                      })
                      : <span>Слоты не выбраны</span>}
                  </div>
                  <button type="button" onClick={() => navigate('/slots/change', { state })}>← К изменению слотов</button>
                </div>
              )}
            </div>
            <div className="review-consents">
              {[1, 2, 3].map(item => (
                <label key={item}>
                  <input type="checkbox" defaultChecked />
                  <span>Согласие на обработку персональных данных<br />и фото-видеосъёмку на турнире</span>
                </label>
              ))}
            </div>
          </aside>

          <div className="review-form">
            <Field label="Email" value={profile.email} />
            <Field label="Телефон" value={profile.phone} />
            <Field label="ФИО" value={profile.full_name} />
            <Field label="Страна" value={profile.country} />
            <Field label="Город" value={profile.city} />
            <Field label="Компания" value={profile.company} />
            <Field label="Должность" value={profile.position} />

            {state.role === 'adviser' && (
              <Field label="Выбранный игрок" value={state.player} />
            )}
            {teamRole && state.role === 'player' && (
              <div className="review-team">
                <span>Состав команды</span>
                <div className="review-team-members">
                  {[profile.full_name, state.teammate].filter(Boolean).map((name, index) => (
                    <span key={`${name}-${index}`}>{name}</span>
                  ))}
                  {!profile.full_name && !state.teammate && <span>Состав не заполнен</span>}
                </div>
              </div>
            )}
            <button
              className="primary-button review-submit"
              onClick={() => navigate('/register/sent', { state: { ...state, roleLabel } })}
            >
              Сохранить / Отправить
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, value }) {
  return (
    <label className="review-field">
      <span>{label}</span>
      <input value={value || ''} readOnly />
    </label>
  );
}
