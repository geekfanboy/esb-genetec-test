export enum TimelineEventType {
  Customer = 'customer',
  Design = 'design',
  Meeting = 'meeting',
  Operations = 'operations',
  Planning = 'planning',
  Product = 'product',
  Release = 'release',
  Research = 'research',
  Team = 'team',
  Training = 'training',
}

export const TIMELINE_EVENT_TYPE_COLORS: Record<TimelineEventType, string> = {
  [TimelineEventType.Customer]: '#0f766e',
  [TimelineEventType.Design]: '#7e22ce',
  [TimelineEventType.Meeting]: '#1d4ed8',
  [TimelineEventType.Operations]: '#475569',
  [TimelineEventType.Planning]: '#0e7490',
  [TimelineEventType.Product]: '#15803d',
  [TimelineEventType.Release]: '#b91c1c',
  [TimelineEventType.Research]: '#a21caf',
  [TimelineEventType.Team]: '#b45309',
  [TimelineEventType.Training]: '#4338ca',
};
