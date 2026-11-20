import { format, parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import type { TimelineEventOccurrence } from './timelineTypes';
import { EVENT_ROW_HEIGHT } from './useTimelineNavigation';
import {
  TIMELINE_EVENT_TYPE_COLORS,
  type TimelineEventType,
} from './timelineEventTypes';
import { cn } from '../utils';

interface EventBarProps extends TimelineEventOccurrence {}

function formatEventDate(value: string) {
  return format(parseISO(value), 'PP');
}

export function EventBar({ event, dayNumber, totalDays, row }: EventBarProps) {
  return (
    <Dialog>
      <DialogTrigger
        type="button"
        className={cn(
          'absolute h-8 text-sm text-slate-700 pl-4 border-r-1 pr-2 py-1 text-white flex justify-between items-center cursor-pointer hover:opacity-80 focus:outline-2 focus:outline-offset-1 focus:outline-slate-500 motion-safe:transition-[background-size,background-position] motion-safe:duration-300 motion-safe:ease-out',
          totalDays === 1
            ? 'rounded-xl w-[calc(100%_-_16px)] translate-x-[8px]'
            : dayNumber === 1
              ? 'rounded-l-xl  w-[calc(100%_-_8px)] translate-x-[8px]'
              : dayNumber === totalDays
                ? 'rounded-r-xl w-[calc(100%_-_8px)]'
                : 'rounded-none w-full',
        )}
        style={{
          backgroundColor: TIMELINE_EVENT_TYPE_COLORS[event.tag],
          top: row * EVENT_ROW_HEIGHT,
        }}
        data-timeline-event
        data-timeline-event-id={event.id}
        data-timeline-event-row={row}
        aria-haspopup="dialog"
        aria-label={
          totalDays > 1
            ? `${event.title}, day ${dayNumber} of ${totalDays}`
            : event.title
        }
      >
        <span className="truncate" title={event.title}>
          {event.title}
        </span>
        {totalDays > 1 && (
          <span className="ml-2 shrink-0 font-bold text-xs bg-white text-slate-700 px-2 rounded-md font-mono">
            {dayNumber}/{totalDays}
          </span>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogTitle className="break-words pr-8 text-lg font-semibold">
          {event.title}
        </DialogTitle>
        <DialogDescription className="whitespace-pre-wrap break-words">
          {event.description}
        </DialogDescription>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="font-semibold">Start</dt>
            <dd>
              <time dateTime={event.startDate}>
                {formatEventDate(event.startDate)}
              </time>
            </dd>
          </div>
          <div>
            <dt className="font-semibold">End</dt>
            <dd>
              <time dateTime={event.endDate}>
                {formatEventDate(event.endDate)}
              </time>
            </dd>
          </div>
          {event.tag && (
            <div className="col-span-2">
              <dt className="font-semibold">Tag</dt>
              <dd
                className="rounded-xs p-1 text-xs font-bold uppercase text-white"
                style={{
                  color:
                    TIMELINE_EVENT_TYPE_COLORS[event.tag as TimelineEventType],
                }}
              >
                {event.tag as string}
              </dd>
            </div>
          )}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
