import type { TimelineEventType } from './timelineEventTypes';

export interface TimelineEvent {
  id: string;
  startDate: string;
  endDate: string;
  title: string;
  description: string;
  tag: TimelineEventType;
}

export interface TimelineEventOccurrence {
  event: TimelineEvent;
  dayNumber: number;
  totalDays: number;
  row: number;
}
