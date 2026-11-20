export const KEY_UP = 'ArrowUp';
export const KEY_DOWN = 'ArrowDown';
export const KEY_LEFT = 'ArrowLeft';
export const KEY_RIGHT = 'ArrowRight';

type ArrowKey =
  typeof KEY_LEFT | typeof KEY_RIGHT | typeof KEY_UP | typeof KEY_DOWN;

interface NavigationGroup {
  events: readonly { row: number }[];
}

interface NavigationPosition {
  dateIndex: number;
  row: number | null;
}

// resolves logic of left/up/right/down navigation within the timeline
export function getTimelineNavigationTarget(
  groups: readonly NavigationGroup[],
  position: NavigationPosition,
  key: ArrowKey,
): NavigationPosition | undefined {
  const { dateIndex, row } = position;
  const group = groups[dateIndex];
  if (!group || group.events.length === 0) return undefined;

  if (key === KEY_LEFT || key === KEY_RIGHT) {
    const nextDateIndex = dateIndex + (key === KEY_RIGHT ? 1 : -1);
    const nextGroup = groups[nextDateIndex];
    if (!nextGroup || nextGroup.events.length === 0) return undefined;
    if (row === null) return { dateIndex: nextDateIndex, row: null };
    const closest = nextGroup.events.reduce((previous, current) =>
      Math.abs(current.row - row) < Math.abs(previous.row - row)
        ? current
        : previous,
    );
    return { dateIndex: nextDateIndex, row: closest.row };
  }

  const direction = key === KEY_DOWN ? 1 : -1;
  if (row === null) {
    return {
      dateIndex,
      row: group.events[direction > 0 ? 0 : group.events.length - 1].row,
    };
  }

  const currentIndex = group.events.findIndex((event) => event.row === row);
  if (currentIndex === -1) return undefined;
  const next = group.events[currentIndex + direction];
  if (next) return { dateIndex, row: next.row };

  const nextDateIndex = dateIndex + direction;
  const nextGroup = groups[nextDateIndex];
  if (!nextGroup || nextGroup.events.length === 0) return undefined;
  return {
    dateIndex: nextDateIndex,
    row: nextGroup.events[direction > 0 ? 0 : nextGroup.events.length - 1].row,
  };
}

// used to resolve conflicting announcements for timeline navigation day v. event
export function getTimelineAnnouncementDateTime(
  groups: readonly { date: Date }[],
  target: NavigationPosition,
) {
  return target.row === null
    ? groups[target.dateIndex]?.date.getTime()
    : undefined;
}
