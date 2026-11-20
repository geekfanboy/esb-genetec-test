import {
  DataGrid,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  EventForm,
  Timeline,
  TIMELINE_EVENT_TYPE_COLORS,
  Toaster,
} from '@org/components';
import type {
  DataColumn,
  TimelineEvent,
  TimelineEventType,
} from '@org/components';
import { format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import React from 'react';

const eventColumns: DataColumn[] = [
  { key: 'title', label: 'Title', width: 240 },
  {
    key: 'startDate',
    label: 'Start date',
    width: 200,
    sortable: true,
    filterable: true,
    accessorFn: (row) => parseISO(row.startDate as string),
    renderFn: (value) => format(value as Date, 'yyyy-MM-dd'),
  },
  {
    key: 'endDate',
    label: 'End date',
    width: 200,
    sortable: true,
    filterable: true,
    accessorFn: (row) => parseISO(row.endDate as string),
    renderFn: (value) => format(value as Date, 'yyyy-MM-dd'),
  },
  {
    key: 'tag',
    label: 'Type',
    width: 200,
    sortable: true,
    filterable: true,
    renderFn: (value) => (
      <span
        className="rounded-xs p-1 text-xs font-bold uppercase text-white"
        style={{
          color: TIMELINE_EVENT_TYPE_COLORS[value as TimelineEventType],
        }}
      >
        {value as string}
      </span>
    ),
  },
  { key: 'description', label: 'Description', width: 320 },
];

export function TimelinePage() {
  const [events, setEvents] = React.useState<TimelineEvent[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [createdEventId, setCreatedEventId] = React.useState<string>();
  const [view, setView] = React.useState<'timeline' | 'grid'>('timeline');
  const timelineContainerRef = React.useRef<HTMLDivElement>(null);
  const initialLoadHandledRef = React.useRef(false);
  const pendingCreatedEventIdRef = React.useRef<string | undefined>(undefined);
  const skipDialogReturnFocusRef = React.useRef(false);
  const eventBlocks = React.useMemo(
    () =>
      events === null
        ? []
        : [{ blockStartRow: 0, rows: events.map((event) => ({ ...event })) }],
    [events],
  );

  React.useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}events.json`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }
        const data: TimelineEvent[] = await response.json();
        setEvents(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }

    const timer = setTimeout(() => {
      void loadEvents();
    }, 1000);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  React.useEffect(() => {
    if (events === null || initialLoadHandledRef.current) return;
    initialLoadHandledRef.current = true;
    if (view === 'timeline') {
      timelineContainerRef.current
        ?.querySelector<HTMLElement>('[role="region"][aria-label="Timeline"]')
        ?.focus({ preventScroll: true });
    }
  }, [events, view]);

  return (
    <main className="prose max-w-none p-6">
      <Toaster />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="mb-0 mr-8">Timeline</h1>
          <Dialog
            open={formOpen}
            onOpenChange={(open) => {
              if (open) skipDialogReturnFocusRef.current = false;
              setFormOpen(open);
            }}
            onOpenChangeComplete={(open) => {
              if (!open && pendingCreatedEventIdRef.current) {
                setCreatedEventId(pendingCreatedEventIdRef.current);
                pendingCreatedEventIdRef.current = undefined;
              }
            }}
          >
            <DialogTrigger
              disabled={events === null}
              className="flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-50"
            >
              <Plus className="mr-2" />
              Add event
            </DialogTrigger>
            <DialogContent finalFocus={() => !skipDialogReturnFocusRef.current}>
              <div className="grid gap-1">
                <DialogTitle className="text-lg font-semibold">
                  Add event
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  Enter the details for your timeline event.
                </DialogDescription>
              </div>
              {events !== null && (
                <EventForm
                  onCancel={() => setFormOpen(false)}
                  onCreate={(event) => {
                    setEvents((current) =>
                      current ? [...current, event] : current,
                    );
                    pendingCreatedEventIdRef.current = event.id;
                    skipDialogReturnFocusRef.current = view === 'timeline';
                    setFormOpen(false);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div
          role="group"
          aria-label="Event view"
          className="not-prose mt-4 flex gap-2"
        >
          <button
            type="button"
            aria-pressed={view === 'timeline'}
            onClick={() => setView('timeline')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 aria-pressed:bg-gray-900 aria-pressed:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Timeline view
          </button>
          <button
            type="button"
            aria-pressed={view === 'grid'}
            onClick={() => setView('grid')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 aria-pressed:bg-gray-900 aria-pressed:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Grid view
          </button>
        </div>
      </div>

      <div ref={timelineContainerRef} className="not-prose mt-8">
        {error ? (
          <p role="alert">Could not load events: {error}</p>
        ) : events === null ? (
          <p>Loading events...</p>
        ) : view === 'timeline' ? (
          <Timeline
            events={events}
            scrollToEventId={createdEventId}
            focusEventOnScroll
            onEventFocus={() => setCreatedEventId(undefined)}
          />
        ) : (
          <section aria-label="Events grid" className="h-[720px]">
            <DataGrid
              rowCount={events.length}
              columns={eventColumns}
              initialSort={{ key: 'startDate', direction: 'descending' }}
              dataBlock={eventBlocks}
            />
          </section>
        )}
      </div>
    </main>
  );
}
