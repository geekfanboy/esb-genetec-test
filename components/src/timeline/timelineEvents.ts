import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns';
import type { TimelineEvent, TimelineEventOccurrence } from './timelineTypes';

export function groupEventsByDate(events: TimelineEvent[]) {
  const grouped = new Map<
    string,
    { date: Date; events: TimelineEventOccurrence[] }
  >();
  const sortedEvents = events
    .map((event) => {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);
      if (!isValid(start) || !isValid(end) || end < start) {
        throw new Error(`Invalid date range for timeline event "${event.id}"`);
      }
      return { event, start, end };
    })
    .sort((first, second) => first.start.getTime() - second.start.getTime());
  const rowEndDates: number[] = [];

  for (const { event, start, end } of sortedEvents) {
    const firstDay = startOfDay(start);
    const lastDay = startOfDay(end);
    const totalDays = differenceInCalendarDays(end, start) + 1;
    const availableRow = rowEndDates.findIndex(
      (rowEnd) => rowEnd < firstDay.getTime(),
    );
    const row = availableRow === -1 ? rowEndDates.length : availableRow;
    rowEndDates[row] = lastDay.getTime();

    for (let day = firstDay; day <= lastDay; day = addDays(day, 1)) {
      const key = format(day, 'yyyy-MM-dd');
      let group = grouped.get(key);
      if (!group) {
        group = { date: day, events: [] };
        grouped.set(key, group);
      }
      group.events.push({
        event,
        dayNumber: differenceInCalendarDays(day, start) + 1,
        totalDays,
        row,
      });
    }
  }

  const groups = [...grouped.values()].sort(
    (first, second) => first.date.getTime() - second.date.getTime(),
  );
  for (const group of groups) {
    group.events.sort((first, second) => first.row - second.row);
  }
  return { groups, rowCount: rowEndDates.length };
}
