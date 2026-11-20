import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { differenceInCalendarDays } from 'date-fns';
import type { TimelineProps } from './Timeline';
import type { TimelineEvent } from './timelineTypes';
import { groupEventsByDate } from './timelineEvents';
import {
  getTimelineAnnouncementDateTime,
  getTimelineNavigationTarget,
  KEY_DOWN,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_UP,
} from './timelineNavigation';

export const DAY_WIDTH = 260; // standard width of day columns
const DATE_GAP = 200; // gap between non-consecutive dates
export const EVENT_ROW_HEIGHT = 36; // height of each event row

function scrollToDate(element: HTMLDivElement, offset: number) {
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  element.scrollTo({
    left: offset,
    behavior: reducedMotion ? 'instant' : 'smooth',
  });
}

// to enable special navigation behaviour for timeline events, including keyboard navigation and smooth scrolling

export function useTimelineNavigation({
  events,
  scrollToEventId,
  focusEventOnScroll,
  onEventFocus,
  onKeyDown,
  onPointerDown,
  onWheel,
}: Pick<TimelineProps, 'onKeyDown' | 'onPointerDown' | 'onWheel'> & {
  events: TimelineEvent[];
  scrollToEventId?: string;
  focusEventOnScroll: boolean;
  onEventFocus?: (eventId: string) => void;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const scrollTargetRef = React.useRef<{
    offset: number;
    dateOffsets: number[];
    index: number;
    announce: boolean;
  } | null>(null);
  const [selectedDateTime, setSelectedDateTime] = React.useState<number>();
  const [announcedDateTime, setAnnouncedDateTime] = React.useState<number>();
  const { groups: groupedEvents, rowCount } = React.useMemo(
    () => groupEventsByDate(events),
    [events],
  );
  const selectedIndex = Math.max(
    0,
    groupedEvents.findIndex(
      (group) => group.date.getTime() === selectedDateTime,
    ),
  );
  const selectedDate = groupedEvents[selectedIndex]?.date;
  const gapsBefore = React.useMemo(
    () =>
      groupedEvents.map((group, index) =>
        index > 0 &&
        differenceInCalendarDays(group.date, groupedEvents[index - 1].date) > 1
          ? DATE_GAP // bigger gap for non consecutive dates
          : 0,
      ),
    [groupedEvents],
  );
  const dateOffsets = React.useMemo(() => {
    let offset = 0;
    return gapsBefore.map((gap) => {
      offset += gap;
      const dateOffset = offset;
      offset += DAY_WIDTH;
      return dateOffset;
    });
  }, [gapsBefore]);
  const getItemKey = React.useCallback(
    (index: number) => groupedEvents[index].date.getTime(),
    [groupedEvents],
  );

  const virtualizer = useVirtualizer({
    count: groupedEvents.length,
    horizontal: true,
    getScrollElement: () => scrollRef.current,
    getItemKey,
    estimateSize: (index) => DAY_WIDTH + gapsBefore[index],
    overscan: 3,
  });

  const scrollRequestRef = React.useRef<{
    id: string | undefined;
    handled: boolean;
  }>({ id: undefined, handled: false });
  React.useLayoutEffect(() => {
    if (scrollRequestRef.current.id !== scrollToEventId) {
      scrollRequestRef.current = { id: scrollToEventId, handled: false };
    }

    if (!scrollToEventId || scrollRequestRef.current.handled) return;
    const element = scrollRef.current;
    const index = groupedEvents.findIndex((group) =>
      group.events.some(({ event }) => event.id === scrollToEventId),
    );
    if (!element || index === -1) return;

    const dateTime = groupedEvents[index].date.getTime();
    element.scrollTo({ left: dateOffsets[index], behavior: 'instant' });
    setAnnouncedDateTime(
      !focusEventOnScroll && document.activeElement === element
        ? dateTime
        : undefined,
    );
    if (selectedDateTime !== dateTime) {
      setSelectedDateTime(dateTime);
    }

    if (focusEventOnScroll) {
      const day = element.querySelector<HTMLElement>(
        `[data-timeline-date="${dateTime}"]`,
      );
      const eventElement = Array.from(
        day?.querySelectorAll<HTMLElement>('[data-timeline-event]') ?? [],
      ).find((item) => item.dataset.timelineEventId === scrollToEventId);
      if (!eventElement) return;
      eventElement.focus({ preventScroll: true });
      if (document.activeElement !== eventElement) return;
    }

    scrollRequestRef.current.handled = true;
    if (focusEventOnScroll) onEventFocus?.(scrollToEventId);
  });

  React.useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const supportsScrollEnd = 'onscrollend' in element;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastScrollLeft = element.scrollLeft;
    let horizontalMoved = false;

    const getNearestDate = () => {
      const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth);
      let nearestIndex = 0;
      let nearestOffset = Math.min(dateOffsets[0], maxScroll);
      for (let index = 1; index < dateOffsets.length; index++) {
        const offset = Math.min(dateOffsets[index], maxScroll);
        if (
          Math.abs(element.scrollLeft - offset) <
          Math.abs(element.scrollLeft - nearestOffset)
        ) {
          nearestOffset = offset;
          nearestIndex = index;
        }
      }
      return { nearestOffset, nearestIndex };
    };

    setSelectedDateTime(
      groupedEvents[getNearestDate().nearestIndex].date.getTime(),
    );

    const snapToNearestDate = () => {
      if (!horizontalMoved) return;
      horizontalMoved = false;
      const target = scrollTargetRef.current;
      const announceTarget =
        target?.announce ?? document.activeElement === element;
      if (
        target?.dateOffsets === dateOffsets &&
        Math.abs(element.scrollLeft - target.offset) <= 1
      ) {
        scrollTargetRef.current = null;
        setSelectedDateTime(groupedEvents[target.index].date.getTime());
        setAnnouncedDateTime(
          announceTarget
            ? groupedEvents[target.index].date.getTime()
            : undefined,
        );
        return;
      }
      const { nearestOffset, nearestIndex } = getNearestDate();
      scrollTargetRef.current = null;
      if (Math.abs(element.scrollLeft - nearestOffset) > 1) {
        scrollTargetRef.current = {
          offset: nearestOffset,
          dateOffsets,
          index: nearestIndex,
          announce: announceTarget,
        };
        scrollToDate(element, nearestOffset);
      }
      if (Math.abs(element.scrollLeft - nearestOffset) <= 1) {
        setSelectedDateTime(groupedEvents[nearestIndex].date.getTime());
        setAnnouncedDateTime(
          announceTarget
            ? groupedEvents[nearestIndex].date.getTime()
            : undefined,
        );
      }
    };

    const handleScroll = () => {
      if (Math.abs(element.scrollLeft - lastScrollLeft) > 0.5) {
        horizontalMoved = true;
      }
      lastScrollLeft = element.scrollLeft;
      if (!supportsScrollEnd) {
        clearTimeout(timer);
        timer = setTimeout(snapToNearestDate, 150);
      }
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    if (supportsScrollEnd) {
      element.addEventListener('scrollend', snapToNearestDate);
    }

    return () => {
      clearTimeout(timer);
      element.removeEventListener('scroll', handleScroll);
      element.removeEventListener('scrollend', snapToNearestDate);
    };
  }, [dateOffsets, groupedEvents]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    const element = event.currentTarget;
    const focusedEvent =
      event.target instanceof Element && element.contains(event.target)
        ? event.target.closest<HTMLElement>('[data-timeline-event]')
        : null;
    const fromEventBar = focusedEvent !== null;
    if (
      event.defaultPrevented ||
      (event.target !== element && !fromEventBar) ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      (event.key !== KEY_LEFT &&
        event.key !== KEY_RIGHT &&
        event.key !== KEY_UP &&
        event.key !== KEY_DOWN)
    ) {
      return;
    }

    const focusedDate = focusedEvent?.closest<HTMLElement>(
      '[data-timeline-date]',
    );
    const focusedDateTime = Number(focusedDate?.dataset.timelineDate);
    const focusedDateIndex = focusedDate
      ? groupedEvents.findIndex(
          (group) => group.date.getTime() === focusedDateTime,
        )
      : -1;
    let activeDateIndex =
      focusedDateIndex >= 0 ? focusedDateIndex : selectedIndex;
    const pendingTarget = scrollTargetRef.current;
    if (
      !fromEventBar &&
      pendingTarget?.dateOffsets === dateOffsets &&
      Math.abs(pendingTarget.offset - element.scrollLeft) > 1
    ) {
      activeDateIndex = pendingTarget.index;
    }

    event.preventDefault();
    const focusEventAtDate = (dateIndex: number, row: number) => {
      const group = groupedEvents[dateIndex];
      element
        .querySelector<HTMLElement>(
          `[data-timeline-date="${group.date.getTime()}"] [data-timeline-event-row="${row}"]`,
        )
        ?.focus({ preventScroll: true });
    };

    const target = getTimelineNavigationTarget(
      groupedEvents,
      {
        dateIndex: activeDateIndex,
        row: focusedEvent
          ? Number(focusedEvent.dataset.timelineEventRow)
          : null,
      },
      event.key,
    );
    if (!target) return;

    if (target.dateIndex !== activeDateIndex) {
      const targetOffset = Math.min(
        dateOffsets[target.dateIndex],
        Math.max(0, element.scrollWidth - element.clientWidth),
      );
      scrollTargetRef.current = {
        offset: targetOffset,
        dateOffsets,
        index: target.dateIndex,
        announce: target.row === null,
      };
      setSelectedDateTime(groupedEvents[target.dateIndex].date.getTime());
      setAnnouncedDateTime(
        getTimelineAnnouncementDateTime(groupedEvents, target),
      );
      scrollToDate(element, targetOffset);
      if (target.row !== null) {
        const row = target.row;
        requestAnimationFrame(() => focusEventAtDate(target.dateIndex, row));
      }
    } else if (target.row !== null) {
      setAnnouncedDateTime(
        getTimelineAnnouncementDateTime(groupedEvents, target),
      );
      focusEventAtDate(target.dateIndex, target.row);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    scrollTargetRef.current = null;
    onPointerDown?.(event);
  };

  const handleDateFocus = (index: number) => {
    const element = scrollRef.current;
    const group = groupedEvents[index];
    if (!element || !group) return;

    scrollTargetRef.current = null;
    setSelectedDateTime(group.date.getTime());
    setAnnouncedDateTime(group.date.getTime());
    element.focus({ preventScroll: true });
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    scrollTargetRef.current = null;
    onWheel?.(event);
  };

  return {
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
  };
}
