// Date
// checkbox if multiday
// Day end
// time?
// Title
// Description
// color?
// tag

import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './components/ui/popover';
import { Button } from './components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from './components/ui/calendar';
import { format } from 'date-fns';

export interface EventFormProps extends React.HTMLAttributes<HTMLElement> {
  startDate?: Date;
  endDate?: Date;
  title?: string;
  description?: string;
  color?: string;
  tags?: string[];
}

export const EventForm = ({
  className,
  startDate,
  endDate,
  title,
  description,
  color,
  tags,
}: EventFormProps) => {
  const [date, setDate] = React.useState<Date>();
  return (
    <>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              data-empty={!date}
              className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
            />
          }
        >
          <CalendarIcon />
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={date} onSelect={setDate} />
        </PopoverContent>
      </Popover>

      {/* <form
        aria-label="New Event Form"
        className={`${className} flex flex-col space-y-4`}
      >
        <div className="flex flex-col space-x-1">
          <label htmlFor="title">Title</label>
          <input type="text" name="title" id="title" className="border p-1" />
        </div>
        <div className="flex flex-col space-x-1">
          <label htmlFor="description">Description</label>
          <textarea
            name="description"
            id="description"
            className="border p-1"
          />
        </div>

        <div className="flex space-x-1">
          <input
            type="checkbox"
            id="multiday"
            name="multiday"
            value="multiday"
          />
          <label htmlFor="multiday">Multiple Days?</label>
        </div>
      </form> */}
    </>
  );
};
