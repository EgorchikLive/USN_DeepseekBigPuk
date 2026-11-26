import apiClient from './client';

export async function fetchTournaments() {
  const { data } = await apiClient.get('/spreadsheet/tournaments');
  return data.tournaments;
}

export async function fetchTournament(tournamentId) {
  const { data } = await apiClient.get(
    `/spreadsheet/tournaments/${encodeURIComponent(tournamentId)}`,
  );
  return data;
}

export async function fetchJudgeApplications(tournamentId) {
  const path = tournamentId
    ? `/spreadsheet/tournaments/${encodeURIComponent(tournamentId)}/applications`
    : '/spreadsheet/applications';
  const { data } = await apiClient.get(path);
  return data.applications;
}

export async function fetchJudgeApplication(applicationId, tournamentId) {
  const path = tournamentId
    ? `/spreadsheet/tournaments/${encodeURIComponent(tournamentId)}/applications/${encodeURIComponent(applicationId)}`
    : `/spreadsheet/applications/${encodeURIComponent(applicationId)}`;
  const { data } = await apiClient.get(path);
  return data;
}

export function getSpreadsheetError(error) {
  if (typeof error.response?.data?.detail === 'string') {
    return error.response.data.detail;
  }
  if (error.response?.status) {
    return `Ошибка API (${error.response.status}). Не удалось загрузить данные таблицы.`;
  }
  return 'Backend недоступен. Проверьте, что FastAPI запущен.';
}
