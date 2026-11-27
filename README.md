# USN_DeepseekBigPuk

## Google Sheets data source

The backend reads the public workbook as an XLSX export. Set `USN_SPREADSHEET_ID`
in `backend/.env` to change the source; the default is the workbook currently
used by the project. Workbook data is cached for 300 seconds by default.

The importer reads tournament schedules, judge responses, and the `Оценки ОС`
and `Оценки КС` sheets. The API exposes tournament lists and schedules under
`/api/v1/spreadsheet/tournaments`; judge responses are available under
`/api/v1/spreadsheet/applications`.

The organizer's LLM request contains schedule counts and aggregated rating
statistics only. It does not include judge names, contact details, or response
text. The workbook does not define the required number of judges per slot, so
the assistant reports assignments and missing assignments without claiming a
staffing deficit.

Install backend dependencies from `backend/requirements.txt`. The workbook
parser requires Python 3.12-compatible dependencies, including `openpyxl`.

## Подключение внешнего микросервиса

В проекте есть два разных направления интеграции:

1. **Фронтенд → API микросервиса**: настроить URL API и сохранить ожидаемые
   маршруты/формат ответов.
2. **FastAPI → сервис регистрации (например, Django)**: заменить заглушку
   синхронизации после регистрации на реальный HTTP-вызов.

### 1. Направить фронтенд на API микросервиса

Создайте `frontend/.env.local` (этот файл не нужно коммитить):

```env
VITE_API_BASE_URL=https://api.example.com/api/v1
```

Укажите базовый адрес API **вместе с `/api/v1`**, но без завершающего слеша.
Сейчас значение по умолчанию задано в `frontend/src/api/client.js`:
`http://127.0.0.1:8000/api/v1`. Переменная `VITE_API_BASE_URL` имеет приоритет
над этим значением. После её изменения перезапустите Vite; для production
задайте переменную на этапе сборки фронтенда.

Чтобы не менять React-код, микросервис должен предоставлять следующие
маршруты относительно базового адреса:

| Метод и путь | Назначение и формат |
| --- | --- |
| `GET /spreadsheet/tournaments` | `{ "tournaments": [...] }` |
| `GET /spreadsheet/tournaments/{tournament_id}` | Данные турнира и `schedule`. У слота используются `id`, `time`, `phase`, `match_count`, `judge_ids`, `assigned_judge_count`. |
| `GET /spreadsheet/tournaments/{tournament_id}/applications` | `{ "applications": [...] }` |
| `GET /spreadsheet/applications` | Ответы судей по всем турнирам: `{ "applications": [...] }` |
| `GET /spreadsheet/applications/{application_id}` | Один ответ судьи |
| `POST /registration/check-email` | Запрос `{ "email": "...", "competition_id": "..." }`; ответ содержит `exists` и, при наличии, `registration` |
| `POST /registration/` | Создание/обновление регистрации; см. схему `RegistrationCreate` в backend |
| `POST /allocate` | Запрос с `tournament_id`, `action` (`analyze` или `recalculate`) и необязательным `selected_slot_id`; ответ содержит `justification` и `summary` |

Префикс `/api/v1` добавляется в `VITE_API_BASE_URL`, поэтому в таблице он не
повторяется. В приложении вызовы данных таблицы собраны в
`frontend/src/api/spreadsheet.js`; если API микросервиса использует другие
пути или поля, адаптируйте этот файл и связанные с ним страницы. Проверка
email и LLM вызываются отдельно из `frontend/src/pages/RegistrationEmail.jsx`
и `frontend/src/pages/OrganizerDashboard.jsx`.

При размещении фронтенда на другом домене разрешите его origin в
`allow_origins` в `backend/app/main.py` (или настройте CORS на самом
микросервисе). Для проверки текущего backend доступны `GET /health` и
интерактивная OpenAPI-документация `/docs`.

### 2. Заменить источник данных Google Sheets

Если меняется только таблица, создайте или обновите `backend/.env`:

```env
USN_SPREADSHEET_ID=<ID_ТАБЛИЦЫ>
SPREADSHEET_CACHE_TTL_SECONDS=300
SPREADSHEET_TIMEOUT_SECONDS=30
```

`USN_SPREADSHEET_ID` — часть URL таблицы между `/d/` и `/edit`. Текущие
настройки и загрузка XLSX находятся в `backend/app/services/spreadsheet_data.py`.
Импортер ожидает листы расписаний, ответы судей и листы оценок ОС/КС. Если
вместо Google Sheets подключается другой источник, замените загрузку и разбор
в этом сервисе, сохранив структуру данных, используемую маршрутами в
`backend/app/api/endpoints/spreadsheet.py`. Для приватной таблицы также
замените публичную XLSX-выгрузку на авторизацию через Google API.

### 3. Подключить отдельный сервис для синхронизации регистраций

`backend/app/services/django_sync.py` пока является заглушкой: он печатает
данные регистрации и возвращает успешный статус, но не отправляет запрос в
Django. Функция вызывается из `backend/app/api/endpoints/registrations.py`
после создания регистрации.

Чтобы подключить настоящий сервис:

1. В `backend/app/services/django_sync.py` замените заглушку на HTTP-запрос
   (зависимость `httpx` уже есть в `backend/requirements.txt`).
2. Настройте URL endpoint и токен авторизации только в `backend/.env`.
   Не помещайте секреты в README, код или переменные `VITE_*` — значения
   `VITE_*` доступны в собранном браузерном приложении.
3. Подключите настройки из `backend/app/core/config.py` либо добавьте
   типизированные настройки для URL и токена. Сейчас `DJANGO_API_URL` и
   `DJANGO_API_TOKEN` объявлены в этом файле, но синхронизация их пока не
   использует.
4. Обрабатывайте HTTP-ошибки и таймауты явно; не возвращайте фиктивный успех,
   если внешний сервис недоступен.

Если endpoint, авторизация или схема JSON у вашего сервиса отличаются,
замените соответствующие URL, заголовок авторизации и преобразование полей
в `django_sync.py`. Сам frontend при этом продолжит обращаться к FastAPI.

### Запуск и проверка

После изменения переменных окружения перезапустите соответствующий процесс:

```bash
# Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend — в отдельном терминале из корня проекта
npm --prefix frontend run dev
```

Проверьте сначала `GET /health`, затем нужные маршруты API через `/docs` или
`curl`. Не коммитьте `backend/.env` и `frontend/.env.local`; для production
используйте секрет-хранилище хостинга.
