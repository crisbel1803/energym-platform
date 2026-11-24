/* eslint-disable @typescript-eslint/no-explicit-any */
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

interface GymCalendarProps {
  events: any[];
  onEventClick?: (info: any) => void;
  onDateClick?: (info: any) => void;
  editable?: boolean;
}

export default function GymCalendar({ events, onEventClick, onDateClick, editable = false }: GymCalendarProps) {
  return (
    <div className="bg-white text-gray-900 rounded-3xl p-4 md:p-8 shadow-2xl overflow-x-auto">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={esLocale}
        firstDay={1}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay'
        }}
        events={events}
        eventClick={onEventClick}
        dateClick={onDateClick}
        editable={editable}
        selectable={editable}
        height="auto"
        allDaySlot={false}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        eventColor="#00c24f"
      />
    </div>
  );
}