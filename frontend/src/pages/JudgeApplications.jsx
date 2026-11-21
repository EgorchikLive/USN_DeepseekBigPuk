import React from 'react';
import { Badge } from '../components/UI';

const ApplicationRow = ({ name, tournament, status, statusType }) => (
  <div className="flex justify-between items-center p-4 border rounded-xl bg-white hover:shadow-sm transition-shadow mb-3 cursor-pointer">
    <div className="font-medium w-1/3">{name}</div>
    <div className="text-gray-500 w-1/3 text-center">{tournament}</div>
    <div className="w-1/3 text-right">
      <Badge type={statusType} text={status} />
    </div>
  </div>
);

export default function JudgeApplications() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border rounded bg-white"></div>
          <span className="font-bold text-lg">USN · Заявки судей</span>
        </div>
        <span className="text-gray-400 text-sm">кликабельный прототип</span>
      </header>

      <div className="space-y-8">
        {/* Секция 1 */}
        <section>
          <div className="inline-block bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm mb-4">необработанных заявок · 1</div>
          <ApplicationRow name="Фамилия Имя Отчество" tournament="Название 1 · классика" status="новая" statusType="default" />
          <ApplicationRow name="Фамилия Имя Отчество" tournament="Название 1 · классика" status="снятие слота" statusType="danger" />
        </section>

        {/* Секция 2 */}
        <section>
          <div className="inline-block bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm mb-4">ответы · 1</div>
          <ApplicationRow name="Фамилия Имя Отчество" tournament="Название 1 · классика" status="да" statusType="success" />
          <ApplicationRow name="Фамилия Имя Отчество" tournament="Название 1 · классика" status="нет" statusType="danger" />
          <ApplicationRow name="Фамилия Имя Отчество" tournament="Название 1 · классика" status="ждем" statusType="warning" />
          <ApplicationRow name="Фамилия Имя Отчество" tournament="Название 1 · классика" status="ждем" statusType="warning" />
        </section>

        {/* Секция 3 */}
        <section>
          <div className="inline-block bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm mb-4">Всего заявок · много</div>
          <ApplicationRow name="Фамилия Имя Отчество" tournament="Название 1 · классика" status="подтверждена" statusType="success" />
          <ApplicationRow name="Фамилия Имя Отчество" tournament="Название 1 · классика" status="подтверждена" statusType="success" />
          <ApplicationRow name="Фамилия Имя Отчество" tournament="Название 1 · классика" status="подтверждена" statusType="success" />
        </section>
      </div>
    </div>
  );
}