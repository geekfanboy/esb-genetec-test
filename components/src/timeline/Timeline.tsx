import React from 'react';
import { format } from 'date-fns';
import { TimelineDay } from './TimelineDay';
import {
  DAY_WIDTH,
  EVENT_ROW_HEIGHT,
  useTimelineNavigation,
} from './useTimelineNavigation';
import type { TimelineEvent } from './timelineTypes';
import { cn } from '../utils';

export { TimelineEventType } from './timelineEventTypes';
export type { TimelineEvent, TimelineEventOccurrence } from './timelineTypes';

export interface TimelineProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  events?: TimelineEvent[];
  scrollToEventId?: string;
  focusEventOnScroll?: boolean;
  onEventFocus?: (eventId: string) => void;
}

const EMPTY_EVENTS: TimelineEvent[] = [];

export const Timeline = ({
  className,
  events = EMPTY_EVENTS,
  scrollToEventId,
  focusEventOnScroll = false,
  onEventFocus,
  onKeyDown,
  onPointerDown,
  onWheel,
  ...props
}: TimelineProps) => {
  const {
    scrollRef,
    groupedEvents,
    rowCount,
    selectedDate,
    announcedDateTime,
    gapsBefore,
    virtualizer,
    handleKeyDown,
    handleDateFocus,
    handlePointerDown,
    handleWheel,
  } = useTimelineNavigation({
    events,
    scrollToEventId,
    focusEventOnScroll,
    onEventFocus,
    onKeyDown,
    onPointerDown,
    onWheel,
  });

  if (!selectedDate) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500',
          className,
        )}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onWheel={onWheel}
        {...props}
      >
        No events to display.
      </div>
    );
  }

  const announcedGroup = groupedEvents.find(
    (group) => group.date.getTime() === announcedDateTime,
  );
  const selectedDayAnnouncement = announcedGroup
    ? `${format(announcedGroup.date, 'MMMM d, yyyy')}, ${
        announcedGroup.events.length
      } ${announcedGroup.events.length === 1 ? 'event' : 'events'}`
    : '';

  return (
    <div
      ref={scrollRef}
      className={cn(
        'overflow-x-auto p-6 rounded-lg focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-slate-200',
        className,
      )}
      role="region"
      aria-label="Timeline"
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onWheel={handleWheel}
      {...props}
    >
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {selectedDayAnnouncement}
      </span>
      <div style={{ width: Math.max(virtualizer.getTotalSize(), 780) }}>
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-[51px] z-[1] h-0.5 bg-slate-200"
          />
          <ol
            className="relative list-none p-0"
            style={{ height: Math.max(240, 80 + rowCount * EVENT_ROW_HEIGHT) }}
          >
            {virtualizer.getVirtualItems().map((item) => {
              const index = item.index;
              const group = groupedEvents[index];
              return (
                <TimelineDay
                  key={group.date.getTime()}
                  group={group}
                  index={index}
                  count={groupedEvents.length}
                  left={item.start + gapsBefore[index]}
                  width={DAY_WIDTH}
                  selectedDate={selectedDate}
                  onDateFocus={handleDateFocus}
                />
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
};
