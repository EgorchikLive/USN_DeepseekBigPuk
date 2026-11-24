import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const slots = [
  ['6:20-6:55', '6:55-7:30', '7:30-8:05', '8:05-8:40'],
  ['9:10-9:45', '9:45-10:20', '10:20-11:15', '11:15-11:55'],
  ['12:20-12:55', '12:55-13:30', '13:30-14:05', '14:05-14:40'],
];

export default function SlotChanges() {
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmed, setConfirmed] = useState(['21.03.2026 · 7:20-8:05', '21.03.2026 · 6:55-7:30']);
  const [proposed, setProposed] = useState(['21.03.2026 · 8:05-8:40', '22.03.2026 · 8:05-8:40']);
  const [withdraw, setWithdraw] = useState(null);
  const [accept, setAccept] = useState(null);
  const [newSlot, setNewSlot] = useState('22.03.2026 · 6:55-7:30');
  const [changed, setChanged] = useState(false);

  const toggleConfirmed = slot => {
    setWithdraw(slot);
  };

  const toggleNewSlot = slot => {
    setNewSlot(current => current === slot ? null : slot);
    setChanged(true);
  };

  const submit = () => {
    navigate('/applications');
  };

  return (
    <Layout title="USN · Изменение слотов" rightContent="кликабельный прототип">
      <div className="slot-change-page">
        <div className="slot-change-layout">
          <aside className="slot-change-side">
            <section>
              <h2>Подтвержденные слоты:</h2>
              <div className="slot-chip-row">
                {confirmed.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    className={`slot-chip confirmed ${withdraw === slot ? 'selected' : ''}`}
                    onClick={() => toggleConfirmed(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              {withdraw && (
                <div className="withdraw-box">
                  <span>Отменить слот?</span>
                  <button type="button" onClick={() => { setConfirmed(current => current.filter(item => item !== withdraw)); setWithdraw(null); setChanged(true); }}>Да</button>
                  <button type="button" onClick={() => setWithdraw(null)}>Нет</button>
                </div>
              )}
            </section>

            <section>
              <h2>Предложенные слоты:</h2>
              <div className="slot-chip-row">
                {proposed.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    className={`slot-chip proposed ${accept === slot ? 'accepted' : ''}`}
                    onClick={() => setAccept(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              {accept && (
                <div className="accept-box">
                  <span>Принять слот?</span>
                  <button type="button" onClick={() => { setConfirmed(current => [...current, accept]); setProposed(current => current.filter(item => item !== accept)); setAccept(null); setChanged(true); }}>Да</button>
                  <button type="button" onClick={() => setAccept(null)}>Нет</button>
                </div>
              )}
            </section>
          </aside>

          <section className="slot-change-card">
            <div className="slot-change-card-header">
              <h2>Доступные слоты</h2>
              <span>Выберите новые слоты</span>
            </div>
            {[
              ['21.03 (сб)', '21.03.2026'],
              ['22.03 (вс)', '22.03.2026'],
            ].map(([title, date]) => (
              <div className="slot-change-day" key={title}>
                <h3>{title}</h3>
                {slots.map((row, roundIndex) => (
                  <div className="slot-change-row" key={roundIndex}>
                    <strong>круг {roundIndex + 1}</strong>
                    <div>
                      {row.map(slot => {
                        const label = `${date} · ${slot}`;
                        return (
                          <button
                            type="button"
                            key={slot}
                            className={`slot-change-pill ${newSlot === label ? 'selected' : ''}`}
                            onClick={() => toggleNewSlot(label)}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </section>
        </div>
        <button className="primary-button slot-change-submit" onClick={submit}>
          {changed ? 'Отправить изменения' : 'Назад'}
        </button>
      </div>
      <footer className="slot-change-footer">Стек: USN (Django) · FastAPI · ИИ-распределение судей · PostgreSQL</footer>
    </Layout>
  );
}
