import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import apiClient from '../api/client';

export default function JudgeApplicationDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { applicationId, competitionId } = useParams();
  const defaultTypes = {
    new: 'new',
    withdraw: 'withdraw',
    yes: 'yes',
    no: 'no',
    wait1: 'wait',
    wait2: 'wait',
  };
  const initial = location.state || { type: defaultTypes[applicationId] || 'new' };
  const [answer, setAnswer] = useState(initial.type === 'yes' ? 'yes' : initial.type === 'no' ? 'no' : initial.type === 'wait' ? 'wait' : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isWithdraw = initial.type === 'withdraw';
  const organizerPath = initial.returnTo || (
    competitionId
      ? `/organizer/tournaments/${competitionId}`
      : '/organizer/tournaments'
  );
  const competitionUuid = competitionId === 'express'
    ? '00000000-0000-0000-0000-000000000002'
    : '00000000-0000-0000-0000-000000000001';

  const handleSubmit = async () => {
    if (!initial.allocationSlots?.length) {
      setSubmitError('Нет данных сетки. Откройте заявку из выбранного турнира организатора.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const { data: aiResult } = await apiClient.post('/allocate', {
        competition_id: competitionUuid,
        action: 'recalculate',
        slots: initial.allocationSlots,
        selected_slot: initial.selectedSlot ? {
          committee: initial.selectedSlot.committee,
          date: initial.selectedSlot.date,
          round: initial.selectedSlot.round,
          required_judges: initial.selectedSlot.required_judges,
          confirmed_judges: initial.selectedSlot.confirmed_judges,
        } : null,
      });
      navigate(organizerPath, {
        state: {
          applicationUpdated: applicationId,
          answer,
          tournament: initial.tournament,
          selectedSlot: initial.selectedSlot,
          mapData: initial.mapData,
          aiResult,
        },
      });
    } catch (error) {
      const detail = error.response?.data?.detail;
      setSubmitError(typeof detail === 'string'
        ? detail
        : error.response?.status
          ? `Ошибка API (${error.response.status}). Проверьте настройки LLM и backend.`
          : 'Backend недоступен. Запустите FastAPI из папки backend на порту 8000.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const name = initial.name || 'Новиков Кирилл Витальевич';
  const confirmed = isWithdraw
    ? ['21.03.2026 · 1 круг', '21.03.2026 · 3 круг']
    : ['21.03.2026 · 7:30-8:05', '21.03.2026 · 12:20-12:55'];

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
              <h2>{initial.type === 'new' ? 'Желаемые слоты:' : 'Подтвержденные слоты:'}</h2>
            <div className="judge-slot-chips">
                {confirmed.map((slot, index) => <span key={`${slot}-${index}`}>{slot}</span>)}
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
                <button onClick={() => navigate(-1)}>Предложить слоты</button>
              </div>
            )}
            {submitError && <p className="judge-detail-error" role="alert">{submitError}</p>}
            <button
              className="primary-button judge-detail-submit"
              onClick={handleSubmit}
              disabled={!answer || isSubmitting}
            >
              {isSubmitting ? 'Пересчитываем сетку...' : 'Принять и пересчитать сетку'}
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
