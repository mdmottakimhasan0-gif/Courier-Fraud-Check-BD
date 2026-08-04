export function CalendarPreview() {
  const days = Array.from({ length: 30 }, (_, index) => index + 1);
  return (
    <div className="grid grid-cols-7 gap-1 text-center text-xs">
      {days.map((day) => (
        <button key={day} className="h-8 rounded-md hover:bg-muted" type="button">
          {day}
        </button>
      ))}
    </div>
  );
}
