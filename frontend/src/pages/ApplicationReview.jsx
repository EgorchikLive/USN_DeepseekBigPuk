import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function ApplicationReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const format = state.competitionId === '2' ? 'экспресс' : state.competitionId === '3' ? 'команда' : 'классика';
  const roleLabels = { adviser: 'Секундант', player: 'Игрок', viewer: 'Зритель', judge: 'Судья' };
  const roleLabel = roleLabels[state.role] || 'Игрок';
  const teamRole = state.competitionId === '3';

  return (
    <Layout title="USN" rightContent="кликабельный прототип">
      <div className="review-page">
        <h1>Проверка заявки</h1>
        <div className="review-layout">
          <aside className="review-side">
            <div className="review-tournament">
              <h2>Название {state.competitionId || '1'}</h2>
              <span className="review-format">{format}</span>
              <p>21 марта 2026</p>
              <span className="review-role-label">Роль:</span>
              <span className="review-role">{roleLabel}</span>
              {state.role === 'judge' && (
                <div className="review-slots">
                  <span>Слоты:</span>
                  <div><span>21.03.2026 · 09:00</span><span>22.03.2026 · 09:00</span></div>
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
            <Field label="Email" value="a.ivanova@club.ru" />
            <Field label="Телефон" value="+7 912 345-67-89" />
            {state.role === 'judge' && state.competitionId !== '1' ? null : null}
            <Field label="ФИО" value="Иванова Анна Сергеевна" />
            <Field label="Страна" value="Россия" />
            <Field label="Город" value="Москва" />
            <Field label="Компания" value="Клуб «Гроссмейстер»" />
            <Field label="Должность" value="Должность" />

            {state.role === 'adviser' && (
              <Field label="Выбранный игрок" value={state.player || 'ФИО'} />
            )}
            {teamRole && state.role === 'player' && (
              <div className="review-team">
                <span>Состав команды</span>
                <div>
                  <input value="Фамилия Имя Отчество" readOnly />
                  <input value={state.teammate || 'Фамилия Имя Отчество'} readOnly />
                  <input value="Фамилия Имя Отчество" readOnly />
                  <input value="Фамилия Имя Отчество" readOnly />
                </div>
              </div>
            )}
            {state.role === 'judge' && (
              <Field label="Изменить слоты" value="Указать доступное время" />
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
      <footer className="review-footer">Стек: USN (Django) · FastAPI · ИИ-распределение судей · PostgreSQL</footer>
    </Layout>
  );
}

function Field({ label, value }) {
  return (
    <label className="review-field">
      <span>{label}</span>
      <input defaultValue={value} />
    </label>
  );
}
