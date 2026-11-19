import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  EventForm,
} from '@org/components';
import React from 'react';

interface TimelineEvent {
  id: string;
  startDate: string;
  endDate: string;
  title: string;
  description: string;
  color: string;
  tags: string[];
}

export function TimelinePage() {
  const [events, setEvents] = React.useState<TimelineEvent[] | null>(null);

  React.useEffect(() => {
    async function loadEvents() {
      const response = await fetch(`${import.meta.env.BASE_URL}events.json`);
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      const data: TimelineEvent[] = await response.json();
      setEvents(data);
    }

    void loadEvents();
  }, []);

  return (
    <main className="prose max-w-none p-6">
      <h1>Timeline</h1>
      <p>This is where we'll put the time line and event adding.</p>

      <Dialog>
        <DialogTrigger className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900">
          Add event
        </DialogTrigger>
        <DialogContent>
          <div className="grid gap-1">
            <DialogTitle className="text-lg font-semibold">
              Add event
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Enter the details for your timeline event.
            </DialogDescription>
          </div>
          <EventForm />
        </DialogContent>
      </Dialog>
      {/* 
      {events === null ? (
        <p>Loading events...</p>
      ) : (
        <>
          <p>{events.length} events</p>
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <strong>{event.title}</strong>
                <div>
                  <time dateTime={event.startDate}>{event.startDate}</time>
                  {' - '}
                  <time dateTime={event.endDate}>{event.endDate}</time>
                </div>
                <div>{event.description}</div>
                <div>
                  Color: {event.color} | Tags: {event.tags.join(', ')}
                </div>
              </li>
            ))}
          </ul>
        </>
      )} */}
    </main>
  );
}
