import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const data = [
  { section: 'необработанных заявок · 1', rows: [
    { id: 'new', name: 'Новиков Кирилл Витальевич', status: 'новая', type: 'new' },
    { id: 'withdraw', name: 'Ахметов Тимур Русланович', status: 'снятие слота', type: 'withdraw' },
  ]},
  { section: 'ответы · 2', rows: [
    { id: 'yes', name: 'Лебедев Игорь Максимович', status: 'да', type: 'yes' },
    { id: 'no', name: 'Лебедева Павловна Дарья', status: 'нет', type: 'no' },
    { id: 'wait1', name: 'Орлова Мария Викторовна', status: 'ждем', type: 'wait' },
    { id: 'wait2', name: 'Соколов Андреевич Дмитрий', status: 'ждем', type: 'wait' },
  ]},
  { section: 'Всего заявок · много', rows: [
    { id: 'ok1', name: 'Морозов Павлович Артём', status: 'подтверждена', type: 'confirmed' },
    { id: 'ok2', name: 'Морозов Павлович Артём', status: 'подтверждена', type: 'confirmed' },
    { id: 'ok3', name: 'Новиков Витальевич Кирилл', status: 'подтверждена', type: 'confirmed' },
  ]},
];

export default function JudgeApplications() {
  const navigate = useNavigate();
  return (
    <Layout title="USN · Заявки судей" rightContent="кликабельный прототип">
      <div className="judge-applications-page">
        <div className="judge-applications-toolbar">
          <button onClick={() => navigate('/organizer')}>← Назад</button>
          <span>Выбранная роль: судья</span>
        </div>
        {data.map(group => (
          <section className="judge-application-group" key={group.section}>
            <h2>{group.section}</h2>
            {group.rows.map(row => (
              <button className="judge-application-row" key={row.id} onClick={() => navigate(`/judge-applications/${row.id}`, { state: row })}>
                <strong>{row.name}</strong>
                <span>{row.id === 'new' ? 'Кубок «Осень-2026» · классика' : 'Кубок «Осень-2026» · классика'}</span>
                <b className={`judge-status ${row.type}`}>{row.status}</b>
              </button>
            ))}
          </section>
        ))}
      </div>
    </Layout>
  );
}