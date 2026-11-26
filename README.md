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
