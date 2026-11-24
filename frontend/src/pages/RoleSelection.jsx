import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function RoleSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('');
  const [combined, setCombined] = useState(false);
  const [player, setPlayer] = useState('');
  const [teammate, setTeammate] = useState('');
  const [needTeammate, setNeedTeammate] = useState(false);
  const isExpress = location.state?.competitionId === '2';
  const isTeam = location.state?.competitionId === '3';
  const roles = isExpress || isTeam
    ? [
        ['player', 'Игрок', isTeam ? 'партия в командном турнире' : 'партия в основном турнире'],
        ['viewer', 'Зритель', 'только просмотр игр'],
        ['judge', 'Судья', 'открывает блок 3 — доступность по слотам'],
      ]
    : [
        ['adviser', 'Секундант', 'только в формате «Классика»'],
        ['player', 'Игрок', 'партия в основном турнире'],
        ['viewer', 'Зритель', 'только просмотр игр'],
        ['judge', 'Судья', 'открывает блок 3 — доступность по слотам'],
      ];

  return (
    <Layout title="USN · Регистрация участника" rightContent={<span className="header-pill">Название {isExpress ? '2' : isTeam ? '3' : '1'} | {isExpress ? 'экспресс' : isTeam ? 'команда' : 'классика'}</span>}>
      <div className="registration-shell" style={{ width: 540, paddingTop: 48 }}>
        <div className="back-step">
          <button className="back-link" onClick={() => navigate(-1)}>← К проверке</button>
          <span className="step">Шаг 2 из 3</span>
        </div>
        <h2 className="block-title">Блок 2 · Данные и выбор роли</h2>
        <div className="role-card">
          <div className="profile-name">Иванова Анна Сергеевна</div>
          <span className="role-label">Роль на турнире:</span>
          <div className="role-grid" style={isExpress ? { gridTemplateColumns: 'repeat(3, 1fr)' } : undefined}>
            {roles.map(([value, title, hint]) => (
              <div key={value} className={`role-option ${role === value ? 'selected' : ''}`} onClick={() => setRole(value)}>
                <span className="radio-dot" />
                <div><strong>{title}</strong><small>{hint}</small></div>
              </div>
            ))}
          </div>
          <span className="combined-label">Совмещенная роль:</span>
          <div className={`combined-option ${combined ? 'selected' : ''}`} onClick={() => setCombined(!combined)}>
            <span className="radio-dot" /><span>Игрок и секундант другого игрока</span>
          </div>
          {(role === 'adviser' || combined) && (
            <div className="player-field">
              <label>Игрок:</label>
              <input className="text-input" value={player} onChange={e => setPlayer(e.target.value)} placeholder="фамилия, имя, отчество" />
            </div>
          )}
          {isTeam && role === 'player' && (
            <div className="team-player-field">
              <label>Сокомандник:</label>
              <input className="text-input" value={teammate} onChange={e => setTeammate(e.target.value)} placeholder="фамилия, имя, отчество" />
              <label className="team-checkbox">
                <input type="checkbox" checked={needTeammate} onChange={e => setNeedTeammate(e.target.checked)} />
                <span>хочу сокомандника</span>
              </label>
            </div>
          )}
          <div className="consents">
            {[1,2,3].map(i => (
              <label className="consent" key={i}><input type="checkbox" defaultChecked /><span>Согласие на обработку персональных данных и фото-видеосъёмку на турнире</span></label>
            ))}
          </div>
          <button
            className="primary-button"
            style={{ width: '240px' }}
            disabled={!role}
            onClick={() => {
              if (role === 'judge') navigate('/register/slots', { state: { ...location.state, role } });
              else navigate('/register/review', { state: { ...location.state, role, combined, player, teammate, needTeammate } });
            }}
          >
            Сохранить / Отправить
          </button>
        </div>
      </div>
    </Layout>
  );
}