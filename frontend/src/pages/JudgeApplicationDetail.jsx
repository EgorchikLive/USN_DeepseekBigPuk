import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';

export default function JudgeApplicationDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const initial = location.state || {};
  const [answer, setAnswer] = useState(initial.type === 'yes' ? 'yes' : initial.type === 'no' ? 'no' : initial.type === 'wait' ? 'wait' : '');

  const isWithdraw = initial.type === 'withdraw';
  const name = initial.name || 'Новиков Кирилл Витальевич';
  const confirmed = isWithdraw
    ? ['21.03.2026 · 1 круг', '21.03.2026 · 3 круг']
    : ['21.03.2026 · 7:30-8:05', '21.03.2026 · 7:30-8:05'];

  return (
    <Layout title="USN · Заявки судей" rightContent="кликабельный прототип">
      <div className="judge-detail-page">
        <button className="judge-detail-back" onClick={() => navigate(-1)}>← Назад</button>
        <div className="judge-detail-layout">
          <section className="judge-personal">
            <h2>Личная информация</h2>
            <JudgeField label="Email" value="m.orlova@agroplus.ua" />
            <JudgeField label="Телефон" value="+380 (44) 580-77-32" />
            <JudgeField label="ФИО" value={name} />
            <JudgeField label="Страна" value="Украина" />
            <JudgeField label="Город" value="Киев" />
            <JudgeField label="Компания" value="«АгроПлюс»" />
            <JudgeField label="Должность" value="Маркетолог" />
          </section>

          <section className="judge-detail-slots">
            <h2>Подтвержденные слоты:</h2>
            <div className="judge-slot-chips">
              {confirmed.map(slot => <span key={slot}>{slot}</span>)}
            </div>

            {isWithdraw && (
              <>
                <div className="judge-change-arrow">↓</div>
                <h3>Снятие со слота:</h3>
                <span className="judge-slot-chip withdrawal">21.03.2026 · 12:55-13:30</span>
                <h3>Новые слоты:</h3>
                <div className="judge-slot-chips proposed">
                  <span>21.03.2026 · 7:30-8:05</span>
                  <span>21.03.2026 · 2:30-8:05</span>
                </div>
              </>
            )}

            {initial.type === 'yes' || initial.type === 'no' || initial.type === 'wait' ? (
              <>
                <h3>Предложенные слоты:</h3>
                <div className="judge-slot-chips proposed">
                  <span>21.03.2026 · 9:10-9:45</span>
                  <span>21.03.2026 · 9:45-10:15</span>
                </div>
                <div className="judge-change-arrow">↓</div>
                <h3>Ответ:</h3>
                <div className="judge-answer-chips">
                  <span className="yes">21.03.2026 · 9:10-9:45</span>
                  <span className="no">21.03.2026 · 9:45-10:15</span>
                </div>
              </>
            ) : null}

            <div className="judge-answer-options">
              <label className={answer === 'yes' ? 'active yes' : 'yes'}>
                <input type="radio" checked={answer === 'yes'} onChange={() => setAnswer('yes')} /> Да
              </label>
              <label className={answer === 'wait' ? 'active wait' : 'wait'}>
                <input type="radio" checked={answer === 'wait'} onChange={() => setAnswer('wait')} /> Ждем ответа
              </label>
              <label className={answer === 'no' ? 'active no' : 'no'}>
                <input type="radio" checked={answer === 'no'} onChange={() => setAnswer('no')} /> Нет
              </label>
            </div>
            {initial.type === 'wait' && (
              <div className="judge-detail-actions">
                <button onClick={() => setAnswer('no')}>Отменить предложение</button>
                <button onClick={() => navigate('/judge-applications')}>Предложить слоты</button>
              </div>
            )}
            <button className="primary-button judge-detail-submit" onClick={() => navigate('/organizer')}>
              Принять и пересчитать сетку
            </button>
          </section>
        </div>
      </div>
    </Layout>
  );
}

function JudgeField({ label, value }) {
  return (
    <label className="judge-field">
      <span>{label}</span>
      <input defaultValue={value} />
    </label>
  );
}
