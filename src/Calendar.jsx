
import { useState } from 'react'

export default function Calendar({
  selectedDates = [],
  onSelect
}) {
  const today = new Date()

  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())

  const firstDay = new Date(year, month, 1).getDay()

  const daysInMonth =
    new Date(year, month + 1, 0).getDate()

  const monthName = new Date(year, month, 1)
    .toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })

  function changeMonth(direction) {
    const next = new Date(year, month + direction, 1)
    setMonth(next.getMonth())
    setYear(next.getFullYear())
  }

  function getDateString(day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => changeMonth(-1)}
        >
          ‹
        </button>

        <h3>{monthName}</h3>

        <button
          type="button"
          aria-label="Next month"
          onClick={() => changeMonth(1)}
        >
          ›
        </button>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          .map(day => (
            <div className="calendar-weekday" key={day}>
              {day}
            </div>
          ))}

        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from(
          { length: daysInMonth },
          (_, i) => i + 1
        ).map(day => {
          const date = getDateString(day)
          const selected = selectedDates.includes(date)

          return (
            <button
              type="button"
              key={date}
              aria-label={date}
              aria-pressed={selected}
              className={
                `calendar-day ${selected ? 'selected' : ''}`
              }
              onClick={() => onSelect(date)}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
