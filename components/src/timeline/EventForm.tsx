import React from 'react';
import { addDays, format, isSameDay, isValid, parse } from 'date-fns';
import { Button } from '../components/ui/button';
import { toast } from '../components/ui/toast';
import type { TimelineEvent } from './timelineTypes';
import { TimelineEventType } from './timelineEventTypes';
import { cn } from '../utils';

export interface EventFormProps extends Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  'onSubmit' | 'onCancel'
> {
  startDate?: Date;
  endDate?: Date;
  title?: string;
  description?: string;
  tag?: TimelineEventType;
  onCreate: (event: TimelineEvent) => void;
  onCancel: () => void;
}

const DATE_FORMAT = 'yyyy-MM-dd';

export const EventForm = ({
  className,
  startDate,
  endDate,
  title,
  description,
  tag,
  onCreate,
  onCancel,
  ...props
}: EventFormProps) => {
  const [multipleDays, setMultipleDays] = React.useState(
    Boolean(startDate && endDate && !isSameDay(startDate, endDate)),
  );
  const [start, setStart] = React.useState(
    format(
      startDate && isValid(startDate) ? startDate : new Date(),
      DATE_FORMAT,
    ),
  );
  const [end, setEnd] = React.useState(
    multipleDays && endDate && isValid(endDate)
      ? format(endDate, DATE_FORMAT)
      : '',
  );
  const [errors, setErrors] = React.useState<{
    title?: string;
    tag?: string;
    start?: string;
    end?: string;
  }>({});

  function parseDate(value: string) {
    const date = parse(value, 'yyyy-MM-dd', new Date());
    return value.length === 10 && isValid(date) ? date : undefined;
  }

  function defaultEnd(startValue: string) {
    const startParsed = parseDate(startValue);
    return startParsed ? format(addDays(startParsed, 1), DATE_FORMAT) : '';
  }

  function validateStart(value: string) {
    if (!value) return 'Enter a start date.';
    if (!parseDate(value)) return 'Start date is not a valid date.';
    return undefined;
  }

  function validateEnd(value: string, startValue: string, multiple: boolean) {
    if (!multiple) return undefined;
    if (!value) return 'Enter an end date.';

    const endParsed = parseDate(value);
    if (!endParsed) return 'End date is not a valid date.';

    const startParsed = parseDate(startValue);
    if (startParsed && endParsed < startParsed) {
      return 'End date must not precede the start date.';
    }
    return undefined;
  }

  const invalidClass = 'border-red-500 outline-red-500 bg-red-50';
  const fields = ['title', 'tag', 'start', 'end'] as const;
  const errorMessages = fields.filter((field) => errors[field]);

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const eventTitle = String(data.get('title') ?? '').trim();
    const selectedTag = Object.values(TimelineEventType).find(
      (type) => type === data.get('tag'),
    );

    // collect errors
    const nextErrors = {
      title: eventTitle ? undefined : 'Enter a title.',
      tag: selectedTag ? undefined : 'Select an event type.',
      start: validateStart(start),
      end: validateEnd(end, start, multipleDays),
    };
    setErrors(nextErrors);

    // jump to first invalid
    const firstInvalid = fields.find((field) => nextErrors[field]);
    if (firstInvalid) {
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    if (!selectedTag) {
      return;
    }

    onCreate({
      id: crypto.randomUUID(),
      startDate: start,
      endDate: multipleDays ? end : start,
      title: eventTitle,
      description: String(data.get('description') ?? '').trim(),
      tag: selectedTag,
    });
    toast.add({
      title: 'Event created',
      description: `"${eventTitle}" added to the timeline & grid.`,
      type: 'success',
    });
    setErrors({});
  }

  return (
    <form
      {...props}
      aria-label="New Event Form"
      className={cn('flex flex-col space-y-4', className)}
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col space-x-1">
        <label htmlFor={`new-event-title`}>
          Title <span aria-hidden="true">*</span>
        </label>
        <input
          type="text"
          name="title"
          id={`new-event-title`}
          defaultValue={title}
          required
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? `new-event-title-error` : undefined}
          className={cn(
            'border p-1 border-gray-200 bg-gray-100 rounded-sm',
            errors.title && invalidClass,
          )}
        />
      </div>
      <div className="flex flex-col space-x-1">
        <label htmlFor={`new-event-description`}>Description</label>
        <textarea
          name="description"
          id={`new-event-description`}
          defaultValue={description}
          className="border p-1 border-gray-200 bg-gray-100 rounded-sm"
        />
      </div>
      <div className="flex flex-col space-x-1">
        <label htmlFor={`new-event-tag`}>
          Tag <span aria-hidden="true">*</span>
        </label>
        <select
          name="tag"
          id={`new-event-tag`}
          defaultValue={tag ?? ''}
          required
          aria-invalid={Boolean(errors.tag)}
          aria-describedby={errors.tag ? `new-event-tag-error` : undefined}
          className={cn(
            'border p-1 border-gray-200 bg-gray-100 rounded-sm capitalize',
            errors.tag && invalidClass,
          )}
        >
          <option value="">Select an event type</option>
          {Object.values(TimelineEventType).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div
        className={cn(
          'grid gap-2',
          multipleDays
            ? 'grid-cols-2 rounded-md border border-gray-200 bg-gray-50 p-2'
            : 'grid-cols-1',
        )}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor={`new-event-start`} className="text-sm">
            {multipleDays ? 'Start Date' : 'Date'}{' '}
            <span aria-hidden="true">*</span>
          </label>
          <input
            type="date"
            name="start"
            id={`new-event-start`}
            value={start}
            required
            onChange={(event) => setStart(event.target.value)}
            aria-invalid={Boolean(errors.start)}
            aria-describedby={
              errors.start ? `new-event-start-error` : undefined
            }
            className={cn(
              'border p-2 border-gray-200 bg-white rounded-md',
              errors.start && invalidClass,
            )}
          />
        </div>
        {multipleDays && (
          <div className="flex flex-col gap-1">
            <label htmlFor={`new-event-end`} className="text-sm">
              End Date <span aria-hidden="true">*</span>
            </label>
            <input
              type="date"
              name="end"
              id={`new-event-end`}
              value={end}
              required
              min={start || undefined}
              onChange={(event) => setEnd(event.target.value)}
              aria-invalid={Boolean(errors.end)}
              aria-describedby={errors.end ? `new-event-end-error` : undefined}
              className={cn(
                'border p-2 border-gray-200 bg-white rounded-md',
                errors.end && invalidClass,
              )}
            />
          </div>
        )}
      </div>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id={`new-event-multiday`}
          className="mt-1"
          checked={multipleDays}
          onChange={(event) => {
            const checked = event.target.checked;
            setMultipleDays(checked);
            const nextEnd = checked ? defaultEnd(start) : '';
            setEnd(nextEnd);
          }}
        />
        <div className="flex flex-col">
          <label htmlFor={`new-event-multiday`}>
            This is a multi-day event
          </label>
          <span className="text-sm text-gray-500">
            Checking this adds an end date for events spanning multiple days.
          </span>
        </div>
      </div>
      {errorMessages.length > 0 && (
        <ul role="alert" className="text-red-600 list-disc pl-5">
          {errorMessages.map((field) => (
            <li key={field} id={`new-event-${field}-error`}>
              {errors[field]}
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create event</Button>
      </div>
    </form>
  );
};
