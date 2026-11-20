import { format, isSameDay } from 'date-fns';
import { EventBar } from './EventBar';
import type { groupEventsByDate } from './timelineEvents';
import { cn } from '../utils';

interface TimelineDayProps {
  group: ReturnType<typeof groupEventsByDate>['groups'][number];
  index: number;
  count: number;
  left: number;
  width: number;
  selectedDate: Date;
  onDateFocus: (index: number) => void;
}

export function TimelineDay({
  group,
  index,
  count,
  left,
  width,
  selectedDate,
  onDateFocus,
}: TimelineDayProps) {
  const eventCount = group.events.length;

  return (
    <li
      onPointerDown={(event) => {
        if (
          event.button === 0 &&
          !(
            event.target instanceof Element &&
            event.target.closest('[data-timeline-event]')
          )
        ) {
          onDateFocus(index);
        }
      }}
      className={cn(
        'absolute top-0 h-full',
        isSameDay(group.date, selectedDate) &&
          'bg-slate-100 outline-2 outline-slate-300 rounded-lg',
      )}
      data-timeline-date={group.date.getTime()} // used for timeline navigation and announcements
      style={{ left, width }}
      aria-label={`${format(group.date, 'MMMM d, yyyy')}, ${eventCount} ${
        eventCount === 1 ? 'event' : 'events'
      }`}
      aria-posinset={index + 1} // position in list. used in virt.
      aria-setsize={count} // total number of items in the list. used in virt.
    >
      <time
        dateTime={format(group.date, 'yyyy-MM-dd')}
        className={cn(
          'absolute inset-x-0 top-[36px] z-10 left-3 w-fit px-2 py-0 rounded-sm',
          isSameDay(group.date, selectedDate)
            ? 'bg-slate-100 text-slate-700 font-bold translate-x-8 scale-150 transform-origin-middle-left'
            : 'bg-white text-slate-500 font-semibold',
        )}
      >
        {format(group.date, 'MMM d, yyyy')}
      </time>
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-10 left-[-12px] z-10 h-6 w-6 rounded-full border-4 border-white shadow-sm bg-slate-700',
          isSameDay(group.date, selectedDate) &&
            'outline-2 outline-slate-700 bg-slate-700',
        )}
      />
      <div className="absolute top-20 text-sm text-slate-700 w-full">
        {group.events.map(({ event, dayNumber, totalDays, row }) => (
          <EventBar
            key={event.id}
            event={event}
            dayNumber={dayNumber}
            totalDays={totalDays}
            row={row}
          />
        ))}
      </div>
    </li>
  );
}
