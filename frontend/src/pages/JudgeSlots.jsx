import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const schedule = [
  {
    date: '21.03 (сб)',
    rounds: [
      ['6:20-6:55', '6:55-7:30', '7:30-8:05', '8:05-8:40'],
      ['9:10-9:45', '9:45-10:20', '10:20-11:15', '11:15-11:55'],
      ['12:20-12:55', '12:55-13:30', '13:30-14:05', '14:05-14:40'],
    ],
  },
  {
    date: '22.03 (вс)',
    rounds: [
      ['6:20-6:55', '6:55-7:30', '7:30-8:05', '8:05-8:40'],
      ['9:10-9:45', '9:45-10:20', '10:20-11:15', '11:15-11:55'],
      ['12:20-12:55', '12:55-13:30', '13:30-14:05', '14:05-14:40'],
    ],
  },
];

export default function JudgeSlots() {
  const navigate = useNavigate();
  const location = useLocation();
  const isTeam = location.state?.competitionId === '3';
  const isExpress = location.state?.competitionId === '2';
  const [selected, setSelected] = useState([
    '21.03 (сб)|круг 1|6:55-7:30',
    '21.03 (сб)|круг 1|7:30-8:05',
  ]);

  const toggle = (date, round, slot) => {
    const key = `${date}|${round}|${slot}`;
    setSelected(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key]);
  };

  return (
    <Layout title="USN · Регистрация участника" rightContent={<span className="header-pill">Название {isTeam ? '3' : isExpress ? '2' : '1'} | {isTeam ? 'команда' : isExpress ? 'экспресс' : 'классика'}</span>}>
      <div className="registration-shell" style={{ width: 540, paddingTop: 48 }}>
        <div className="back-step">
          <button className="back-link" onClick={() => navigate(-1)}>← К ролям</button>
          <span className="step">Шаг 3 из 3</span>
        </div>
        <div className="slots-card">
          <div className="slots-header">
            <h2>Блок 3 · Доступность по слотам</h2>
            <span>Выбрано слотов: {selected.length} · минимум для судейства — 1</span>
          </div>
          {schedule.map(day => (
            <section className="slots-day" key={day.date}>
              <h3>{day.date}</h3>
              {day.rounds.map((slots, roundIndex) => (
                <div className="slots-row" key={roundIndex}>
                  <strong>круг {roundIndex + 1}</strong>
                  <div className="slots-list">
                    {slots.map(slot => {
                      const key = `${day.date}|круг ${roundIndex + 1}|${slot}`;
                      return (
                        <button
                          type="button"
                          key={slot}
                          className={`slot-pill ${selected.includes(key) ? 'selected' : ''}`}
                          onClick={() => toggle(day.date, `круг ${roundIndex + 1}`, slot)}
                        >
                          <span className="slot-desktop-time">{slot}</span>
                          <span className="slot-mobile-time">{slot.split('-')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
        <button className="primary-button slots-submit" disabled={selected.length < 1} onClick={() => navigate('/register/review', { state: { ...location.state, role: 'judge', slots: selected } })}>
          Отправить заявку
        </button>
        {selected.length > 0 && <p className="slots-note">После отправки статус — «на подтверждении у главного судьи»</p>}
      </div>
    </Layout>
  );
}
