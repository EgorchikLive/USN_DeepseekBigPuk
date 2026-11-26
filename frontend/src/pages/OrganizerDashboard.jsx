import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CalendarDays, RefreshCw } from 'lucide-react';
import { Button } from '../components/UI';
import apiClient from '../api/client';
import {
  fetchJudgeApplications,
  fetchTournament,
  getSpreadsheetError,
} from '../api/spreadsheet';

function getPhaseGroup(slot) {
  const phase = slot.phase || '';
  if (/групп|^группа/i.test(phase)) return 'Групповой этап';
  if (/финал|место|1\/\d+/i.test(phase)) return 'Плей-офф';
  if (Number(slot.match_count) === 0) return 'Перерывы и резервы';
  return phase || 'Этап не указан';
}

function formatMatchCount(count) {
  const plural = new Intl.PluralRules('ru').select(Number(count));
  const word = {
    one: 'матч',
    few: 'матча',
    many: 'матчей',
    other: 'матча',
  }[plural];
  return `${count} ${word}`;
}

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { competitionId } = useParams();
  const [sourceState, setSourceState] = useState({
    tournamentId: null,
    tournament: null,
    error: '',
  });
  const loadingTournament = sourceState.tournamentId !== competitionId;
  const tournament = loadingTournament ? null : sourceState.tournament;
  const tournamentError = loadingTournament ? '' : sourceState.error;
  const [scenarios, setScenarios] = useState({});
  const initialScenario = {
    selectedSlotId: location.state?.selectedSlotId || location.state?.selectedSlot?.id || '',
    aiResult: location.state?.aiResult || null,
    assignmentOverrides: location.state?.assignmentOverrides || {},
  };
  const scenario = scenarios[competitionId] || initialScenario;
  const { selectedSlotId, aiResult, assignmentOverrides } = scenario;
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisErrorState, setAnalysisErrorState] = useState({
    tournamentId: null,
    error: '',
  });
  const aiError = analysisErrorState.tournamentId === competitionId
    ? analysisErrorState.error
    : '';
  const [applicationState, setApplicationState] = useState({
    tournamentId: null,
    applications: [],
    error: '',
  });
  const applications = applicationState.tournamentId === competitionId
    ? applicationState.applications
    : [];
  const applicationsError = applicationState.tournamentId === competitionId
    ? applicationState.error
    : '';
  const applicationsLoading = applicationState.tournamentId !== competitionId;
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateScenario = updates => {
    setScenarios(current => {
      const currentScenario = current[competitionId] || initialScenario;
      const nextUpdates = typeof updates === 'function'
        ? updates(currentScenario)
        : updates;
      return {
        ...current,
        [competitionId]: { ...currentScenario, ...nextUpdates },
      };
    });
  };

  useEffect(() => {
    let active = true;
    fetchTournament(competitionId)
      .then(data => {
        if (active) {
          setSourceState({
            tournamentId: competitionId,
            tournament: data,
            error: '',
          });
        }
      })
      .catch(error => {
        if (active) {
          setSourceState({
            tournamentId: competitionId,
            tournament: null,
            error: getSpreadsheetError(error),
          });
        }
      });
    fetchJudgeApplications(competitionId)
      .then(items => {
        if (active) {
          setApplicationState({
            tournamentId: competitionId,
            applications: items,
            error: '',
          });
        }
      })
      .catch(error => {
        if (active) {
          setApplicationState({
            tournamentId: competitionId,
            applications: [],
            error: getSpreadsheetError(error),
          });
        }
      });

    return () => { active = false; };
  }, [competitionId]);

  const schedule = (tournament?.schedule || []).map(slot => {
    const judgeIds = assignmentOverrides[slot.id] || slot.judge_ids || [];
    return {
      ...slot,
      judge_ids: judgeIds,
      assigned_judge_count: judgeIds.length,
    };
  });
  const activeSlotId = schedule.some(slot => slot.id === selectedSlotId)
    ? selectedSlotId
    : schedule.find(slot => slot.match_count > 0)?.id
    || schedule[0]?.id
    || '';
  const selectedSlot = schedule.find(slot => slot.id === activeSlotId) || null;
  const unassignedSlotCount = schedule.filter(
    slot => slot.assigned_judge_count === 0 && slot.match_count > 0,
  ).length;
  const assignedJudgeIds = new Set(schedule.flatMap(slot => slot.judge_ids.map(String)));
  const assignedJudgeCount = assignedJudgeIds.size;
  const candidates = applications.filter(
    application => !selectedSlot?.judge_ids.some(
      judgeId => String(judgeId) === String(application.judge_id),
    ),
  );
  const groups = new Map();
  for (const slot of schedule) {
    const group = getPhaseGroup(slot);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(slot);
  }
  const phaseGroups = [...groups.entries()];

  const assignJudge = judgeId => {
    if (!selectedSlot) return;
    updateScenario(currentScenario => {
      const currentJudgeIds = currentScenario.assignmentOverrides[selectedSlot.id]
        || selectedSlot.judge_ids;
      if (currentJudgeIds.includes(judgeId)) return {};
      return {
        assignmentOverrides: {
          ...currentScenario.assignmentOverrides,
          [selectedSlot.id]: [...currentJudgeIds, judgeId],
        },
      };
    });
    updateScenario({ notice: 'Изменение добавлено в локальный сценарий.' });
  };

  const removeJudge = judgeId => {
    if (!selectedSlot) return;
    updateScenario(currentScenario => {
      const currentJudgeIds = currentScenario.assignmentOverrides[selectedSlot.id]
        || selectedSlot.judge_ids;
      return {
        assignmentOverrides: {
          ...currentScenario.assignmentOverrides,
          [selectedSlot.id]: currentJudgeIds.filter(id => id !== judgeId),
        },
      };
    });
    updateScenario({ notice: 'Изменение добавлено в локальный сценарий.' });
  };

  const handleAllocate = async (action = 'analyze') => {
    setLoadingAnalysis(true);
    setAnalysisErrorState({ tournamentId: competitionId, error: '' });
    updateScenario({ aiResult: null });
    try {
      const { data } = await apiClient.post('/allocate', {
        tournament_id: competitionId,
        action,
        selected_slot_id: action === 'analyze' ? activeSlotId || null : null,
      });
      updateScenario({ aiResult: data });
    } catch (error) {
      setAnalysisErrorState({
        tournamentId: competitionId,
        error: getSpreadsheetError(error),
      });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      window.sessionStorage.setItem(
        'usn-organizer-allocation',
        JSON.stringify({
          tournamentId: competitionId,
          selectedSlotId: activeSlotId,
          aiResult,
          assignmentOverrides,
        }),
      );
      navigate(`/organizer/tournaments/${competitionId}/saved`, {
        state: {
          tournament,
          selectedSlotId: activeSlotId,
          aiResult,
          assignmentOverrides,
          returnTo: location.pathname,
        },
      });
    } catch {
      setAnalysisErrorState({
        tournamentId: competitionId,
        error: 'Не удалось сохранить сценарий в текущей сессии браузера.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="organizer-dashboard">
      <header className="organizer-header">
        <div className="organizer-brand">
          <div className="organizer-brand-mark">USN</div>
          <span>Панель организатора</span>
        </div>
        {tournament && (
          <div className="organizer-header-actions">
            <div className="organizer-tournament-label">
              {tournament.title}
            </div>
            <span className="organizer-header-count">
              Судей в расписании <b>{assignedJudgeCount}</b>
            </span>
            <span className="organizer-header-count">
              Без назначений <b>{unassignedSlotCount}</b>
            </span>
            <button
              className="organizer-applications-link"
              onClick={() => navigate(
                `/organizer/tournaments/${competitionId}/applications`,
                { state: { tournament, returnTo: location.pathname } },
              )}
            >
              К заявкам <span>→</span>
            </button>
          </div>
        )}
      </header>

      {loadingTournament && (
        <p className="spreadsheet-state">Загружаем расписание из таблицы...</p>
      )}
      {tournamentError && (
        <p className="spreadsheet-state error" role="alert">{tournamentError}</p>
      )}

      {!loadingTournament && !tournamentError && tournament && (
        <>
          <section className="organizer-page-meta">
            <div className="organizer-event-date">
              <CalendarDays size={15} />
              {tournament.dates.length
                ? tournament.dates.join(' · ')
                : 'Дата не указана'}
            </div>
            <strong>{tournament.format}</strong>
            <span className="organizer-response-count">
              Ответы судей · <b>{applications.length}</b>
            </span>
          </section>

          <section className="organizer-legend">
            <span><i className="assigned" /> Есть назначения из таблицы</span>
            <span><i className="unassigned" /> Назначений нет</span>
            <span><i className="selected" /> Выбранный слот</span>
          </section>

          <main className="organizer-dashboard-main">
            <section className="organizer-panel organizer-timeline-panel">
              <div className="organizer-panel-heading">
                <div>
                  <h2>Сетка расписания</h2>
                  <p className="organizer-source-meta">Источник: Google Sheets</p>
                </div>
                <span className="organizer-source-tag">{schedule.length} слотов</span>
              </div>

              {tournament.problematic_slots && (
                <details className="organizer-problem-note">
                  <summary>Заметка из таблицы</summary>
                  <p>{tournament.problematic_slots}</p>
                </details>
              )}

              {schedule.length === 0 ? (
                <p className="spreadsheet-state">Для турнира нет записей расписания.</p>
              ) : (
                <div className="organizer-timeline-groups">
                  {phaseGroups.map(([phase, slots]) => (
                    <section className="organizer-timeline-group" key={phase}>
                      <h3>{phase}</h3>
                      <div className="organizer-time-grid">
                        {slots.map(slot => (
                          <button
                            className={[
                              'organizer-time-chip',
                              slot.assigned_judge_count > 0 ? 'assigned' : 'unassigned',
                              activeSlotId === slot.id ? 'selected' : '',
                            ].filter(Boolean).join(' ')}
                            key={slot.id}
                            type="button"
                            title={`${slot.time} · ${slot.assigned_judge_count} назначено`}
                            aria-pressed={activeSlotId === slot.id}
                            onClick={() => {
                              updateScenario({ selectedSlotId: slot.id, aiResult: null });
                              setAnalysisErrorState({ tournamentId: competitionId, error: '' });
                            }}
                          >
                            <strong>{slot.time || 'Время не указано'}</strong>
                            <span>{slot.assigned_judge_count} суд.</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              <div className="organizer-selected-slot">
                {selectedSlot ? (
                  <div>
                    <h4>{selectedSlot.time} · {selectedSlot.phase || 'Этап не указан'}</h4>
                    <p>
                      {selectedSlot.match_count
                        ? formatMatchCount(selectedSlot.match_count)
                        : 'Игровой блок не указан'}
                      {' · '}{selectedSlot.assigned_judge_count} назначено
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4>Слот не выбран</h4>
                    <p>Выберите время в сетке, чтобы посмотреть состав.</p>
                  </div>
                )}
              </div>

              {unassignedSlotCount > 0 && (
                <p className="organizer-unassigned-note">
                  <AlertTriangle size={15} />
                  Игровых слотов без назначений: {unassignedSlotCount}. Норма судей на слот в источнике не указана.
                </p>
              )}
            </section>

            <section className="organizer-panel organizer-assignment-panel">
              <div className="organizer-panel-heading">
                <div>
                  <h2>Состав судей</h2>
                  <p className="organizer-source-meta">
                    {selectedSlot
                      ? `Выбран слот · ${selectedSlot.time}`
                      : 'Сначала выберите слот в сетке'}
                  </p>
                </div>
                {selectedSlot && (
                  <span className="organizer-assignment-count">
                    {selectedSlot.assigned_judge_count}
                  </span>
                )}
              </div>

              <p className="organizer-local-note">
                Изменения — только в локальном сценарии; в таблицу они не записываются.
              </p>

              {selectedSlot ? (
                <>
                  <section className="organizer-roster-section">
                    <div className="organizer-roster-heading">
                      <h3>Назначены в слот</h3>
                      <span>{selectedSlot.judge_ids.length}</span>
                    </div>
                    {selectedSlot.judge_ids.length ? (
                      <div className="organizer-roster-grid">
                        {selectedSlot.judge_ids.map(judgeId => {
                          const application = applications.find(
                            item => String(item.judge_id) === String(judgeId),
                          );
                          return (
                            <article className="organizer-judge-card assigned" key={judgeId}>
                              <button
                                type="button"
                                className="organizer-judge-profile"
                                disabled={!application}
                                onClick={() => application && navigate(
                                  `/organizer/tournaments/${competitionId}/applications/${encodeURIComponent(application.id)}`,
                                  {
                                    state: {
                                      application,
                                      tournament,
                                      returnTo: location.pathname,
                                    },
                                  },
                                )}
                              >
                                <b>{judgeId}</b>
                                <small>
                                  {application
                                    ? [application.city, application.club].filter(Boolean).join(' · ') || 'Профиль без города и клуба'
                                    : 'Ответ не найден'}
                                </small>
                              </button>
                              <button
                                type="button"
                                className="organizer-remove-judge"
                                aria-label={`Убрать судью ${judgeId}`}
                                onClick={() => removeJudge(judgeId)}
                              >
                                Убрать
                              </button>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="organizer-empty-roster">В источнике назначений на этот слот нет.</p>
                    )}
                  </section>

                  <section className="organizer-roster-section candidates">
                    <div className="organizer-roster-heading">
                      <h3>Другие ответы судей</h3>
                      <span>{candidates.length}</span>
                    </div>
                    <p className="organizer-candidate-hint">
                      Перед добавлением проверьте доступность и занятость в других слотах.
                    </p>
                    {applicationsError ? (
                      <p className="spreadsheet-state error" role="alert">{applicationsError}</p>
                    ) : applicationsLoading ? (
                      <p className="organizer-empty-roster">Загружаем ответы судей...</p>
                    ) : applications.length === 0 ? (
                      <p className="organizer-empty-roster">Ответы судей не найдены.</p>
                    ) : candidates.length === 0 ? (
                      <p className="organizer-empty-roster">Все ответы уже представлены в этом слоте.</p>
                    ) : (
                      <>
                        <div className="organizer-roster-grid">
                          {candidates.slice(0, showAllCandidates ? candidates.length : 3).map(application => (
                            <article className="organizer-judge-card candidate" key={application.id}>
                              <button
                                type="button"
                                className="organizer-judge-profile"
                                onClick={() => navigate(
                                  `/organizer/tournaments/${competitionId}/applications/${encodeURIComponent(application.id)}`,
                                  {
                                    state: {
                                      application,
                                      tournament,
                                      returnTo: location.pathname,
                                    },
                                  },
                                )}
                              >
                                <b>{application.judge_id}</b>
                                <small>
                                  {[application.city, application.club].filter(Boolean).join(' · ') || 'Профиль без города и клуба'}
                                </small>
                                <small>
                                  {assignedJudgeIds.has(String(application.judge_id))
                                    ? 'Есть в других слотах'
                                    : 'Пока без назначений'}
                                </small>
                              </button>
                              <button
                                type="button"
                                className="organizer-add-judge"
                                onClick={() => assignJudge(application.judge_id)}
                              >
                                + Добавить
                              </button>
                            </article>
                          ))}
                        </div>
                        {candidates.length > 3 && (
                          <button
                            type="button"
                            className="organizer-show-candidates"
                            onClick={() => setShowAllCandidates(current => !current)}
                          >
                            {showAllCandidates ? 'Свернуть список' : `Показать всех · ${candidates.length}`}
                          </button>
                        )}
                      </>
                    )}
                  </section>
                  {scenario.notice && <p className="organizer-scenario-notice">{scenario.notice}</p>}
                </>
              ) : (
                <div className="organizer-assignment-empty">
                  Выберите слот, чтобы посмотреть назначенных судей и ответы-кандидаты.
                </div>
              )}

              <div className="organizer-workflow-actions">
                <button
                  type="button"
                  className="organizer-dashboard-back"
                  onClick={() => navigate('/organizer/tournaments')}
                >
                  ← К турнирам
                </button>
                <Button
                  className="organizer-sync-button"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Сохраняем...' : 'Сохранить сценарий'}
                </Button>
              </div>
            </section>

            <section className="organizer-panel organizer-assistant-panel">
              <h2>Пояснение ИИ (LLM)</h2>
              <div className="organizer-shortage-alert">
                <div><AlertTriangle size={18} /> Источник анализа</div>
                <p>
                  Анализ строится по расписанию из таблицы; локальные изменения сценария в него не передаются.
                </p>
                <small>Имена, контакты и индивидуальные ответы судей в LLM не отправляются.</small>
              </div>

              <div className="organizer-ai-explanation">
                <h4>Результат анализа</h4>
                <div>
                  {aiResult ? (
                    <p className="organizer-ai-result">{aiResult.justification}</p>
                  ) : aiError ? (
                    <p className="organizer-ai-error" role="alert">{aiError}</p>
                  ) : loadingAnalysis ? (
                    <p>Сопоставляем расписание с агрегированными оценками из таблицы.</p>
                  ) : (
                    <p className="organizer-ai-hint">
                      Выберите слот для анализа или запустите анализ всего расписания.
                    </p>
                  )}
                  {aiResult?.summary && (
                    <p className="organizer-ai-summary">
                      Игровых слотов: {aiResult.summary.game_slot_count}; без назначений: {aiResult.summary.slots_without_assignments}.
                    </p>
                  )}
                </div>
              </div>

              <div className="organizer-assistant-actions">
                <Button
                  className="organizer-ai-button"
                  onClick={() => handleAllocate('analyze')}
                  disabled={loadingAnalysis || !selectedSlot}
                >
                  {loadingAnalysis ? 'Анализируем...' : 'Анализ выбранного слота'}
                </Button>
                <Button
                  variant="secondary"
                  className="organizer-recalculate-button"
                  onClick={() => handleAllocate('recalculate')}
                  disabled={loadingAnalysis || schedule.length === 0}
                >
                  <RefreshCw size={16} className={loadingAnalysis ? 'animate-spin' : ''} />
                  Всё расписание
                </Button>
              </div>
            </section>
          </main>
        </>
      )}
    </div>
  );
}
