// Small green icons after an event's title:
//   check  = you booked a seat at this event
//   badge  = you organize this event
// The tooltip text is also the accessible name.
export default function EventBadges({ event }) {
  if (!event.is_registered && !event.is_organizer) return null;
  return (
    <span className="badges">
      {event.is_organizer && (
        <span className="badge" role="img" aria-label="You are organizer of this event" data-tip="You are organizer of this event">
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            {/* person with a star: "organizer" */}
            <circle cx="8" cy="6" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path d="M2.5 17c.6-3.3 2.8-5 5.5-5 1.2 0 2.3.3 3.1.9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M15 10.5l1.1 2.2 2.4.35-1.75 1.7.41 2.4L15 16l-2.16 1.15.41-2.4-1.75-1.7 2.4-.35z" fill="currentColor" />
          </svg>
        </span>
      )}
      {event.is_registered && (
        <span className="badge" role="img" aria-label="You have booked this event" data-tip="You have booked this event">
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path d="M6.2 10.3l2.5 2.5 5.1-5.3" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </span>
  );
}
