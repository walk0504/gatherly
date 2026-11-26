
import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const options = [
  {
    value: 'green',
    label: "I'm available",
    description: 'This day works for me.',
    symbol: '✓'
  },
  {
    value: 'yellow',
    label: 'I could make it work',
    description: 'Not ideal, but possible.',
    symbol: '?'
  },
  {
    value: 'red',
    label: 'I cannot make it',
    description: 'This day will not work.',
    symbol: '×'
  }
]

export default function Availability({
  event,
  session,
  onBack
}) {
  const dates = [...(event.event_dates || [])]
    .sort((a, b) =>
      a.event_date.localeCompare(b.event_date)
    )

  const firstDate = dates[0]
    ? new Date(`${dates[0].event_date}T12:00:00`)
    : new Date()

  const [month, setMonth] = useState(
    firstDate.getMonth()
  )

  const [year, setYear] = useState(
    firstDate.getFullYear()
  )

  const [mode, setMode] = useState('green')
  const [votes, setVotes] = useState({})
  const [savedVotes, setSavedVotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [message, setMessage] = useState('')

  const closed =
    event.status !== 'open' ||
    (
      event.response_deadline &&
      new Date(event.response_deadline) <= new Date()
    )

  const dateMap = Object.fromEntries(
    dates.map(date => [date.event_date, date.id])
  )

  const answered = dates.filter(
    date => votes[date.id]
  ).length

  const changed = dates.some(
    date => votes[date.id] !== savedVotes[date.id]
  )

  useEffect(() => {
    let active = true

    async function loadVotes() {
      setLoading(true)
      setLoadFailed(false)
      setMessage('')

      const ids = (event.event_dates || [])
        .map(date => date.id)

      if (ids.length === 0) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('availability')
        .select('event_date_id, status')
        .eq('user_id', session.user.id)
        .in('event_date_id', ids)

      if (!active) return

      if (error) {
        setMessage(error.message)
        setLoadFailed(true)
      } else {
        const existing = Object.fromEntries(
          (data || []).map(vote => [
            vote.event_date_id,
            vote.status
          ])
        )

        setVotes(existing)
        setSavedVotes(existing)
      }

      setLoading(false)
    }

    loadVotes()

    return () => {
      active = false
    }
  }, [event, session.user.id])

  function changeMonth(direction) {
    const next = new Date(
      year,
      month + direction,
      1
    )

    setMonth(next.getMonth())
    setYear(next.getFullYear())
  }

  function selectDate(dateId) {
    if (
      !dateId || closed || saving ||
      loading || loadFailed
    ) return

    setMessage('')

    setVotes(previous => {
      const next = { ...previous }

      if (next[dateId] === mode) {
        delete next[dateId]
      } else {
        next[dateId] = mode
      }

      return next
    })
  }

  async function saveAvailability() {
    if (closed || saving || loading || loadFailed) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      for (const date of dates) {
        const current = votes[date.id]
        const previous = savedVotes[date.id]

        if (current === previous) continue

        if (!current && previous) {
          const { error } = await supabase
            .from('availability')
            .delete()
            .eq('event_date_id', date.id)
            .eq('user_id', session.user.id)

          if (error) throw error

        } else if (previous) {
          const { error } = await supabase
            .from('availability')
            .update({
              status: current,
              updated_at: new Date().toISOString()
            })
            .eq('event_date_id', date.id)
            .eq('user_id', session.user.id)
            .select('id')
            .single()

          if (error) throw error

        } else {
          const { error } = await supabase
            .from('availability')
            .insert({
              event_date_id: date.id,
              user_id: session.user.id,
              status: current
            })

          if (error) throw error
        }

        setSavedVotes(old => {
          const next = { ...old }

          if (current) {
            next[date.id] = current
          } else {
            delete next[date.id]
          }

          return next
        })
      }

      setMessage('Your availability has been saved!')

    } catch (error) {
      setMessage(
        `Some responses may have saved. ${error.message}`
      )
    } finally {
      setSaving(false)
    }
  }

  function handleBack() {
    if (
      changed &&
      !window.confirm(
        'You have unsaved changes. Leave anyway?'
      )
    ) return

    onBack()
  }

  const firstDay =
    new Date(year, month, 1).getDay()

  const daysInMonth =
    new Date(year, month + 1, 0).getDate()

  return (
    <section className="dashboard">

      <button
        className="secondary-button"
        onClick={handleBack}
        disabled={saving}
      >
        ← Back to Events
      </button>

      <h1>{event.title}</h1>

      <p>{event.circles?.name}</p>
      <p>{event.description}</p>

      {event.location && (
        <p>📍 {event.location}</p>
      )}

      {event.response_deadline && (
        <p>
          Responses due:{' '}
          {new Date(event.response_deadline)
            .toLocaleString()}
        </p>
      )}

      <div className="circle-form availability-form">
        <h2>My Availability</h2>

        {closed && (
          <div className="auth-message">
            Voting is closed for this event.
          </div>
        )}

        <p>
          Choose a color, then tap the dates
          on the calendar.
        </p>

        <div className="vote-options">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              disabled={
                closed || loading ||
                saving || loadFailed
              }
              aria-pressed={mode === option.value}
              className={
                `vote-option ${option.value} ${
                  mode === option.value
                    ? 'active-vote'
                    : ''
                }`
              }
              onClick={() => setMode(option.value)}
            >
              <span className="vote-symbol">
                {option.symbol}
              </span>

              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="calendar">
          <div className="calendar-header">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              ‹
            </button>

            <h3>
              {new Date(year, month, 1)
                .toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
            </h3>

            <button
              type="button"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              ›
            </button>
          </div>

          <div className="calendar-grid">
            {[
              'Sun', 'Mon', 'Tue', 'Wed',
              'Thu', 'Fri', 'Sat'
            ].map(day => (
              <div
                className="calendar-weekday"
                key={day}
              >
                {day}
              </div>
            ))}

            {Array.from(
              { length: firstDay },
              (_, i) => (
                <div key={`empty-${i}`} />
              )
            )}

            {Array.from(
              { length: daysInMonth },
              (_, i) => i + 1
            ).map(day => {
              const date =
                `${year}-${String(month + 1)
                  .padStart(2, '0')}-${String(day)
                  .padStart(2, '0')}`

              const dateId = dateMap[date]
              const vote = votes[dateId]

              return (
                <button
                  key={date}
                  type="button"
                  aria-label={
                    `${date}: ${vote || 'Unanswered'}`
                  }
                  disabled={
                    !dateId || closed || saving ||
                    loading || loadFailed
                  }
                  className={
                    `calendar-day voting-day ${
                      !dateId ? 'not-candidate' : ''
                    } ${vote || ''}`
                  }
                  onClick={() => selectDate(dateId)}
                >
                  {day}

                  {vote && (
                    <small>
                      {options.find(
                        item => item.value === vote
                      )?.symbol}
                    </small>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <p className="calendar-hint">
          Only the event's proposed dates
          can be selected. Tap a date again
          with the same color to clear it.
        </p>

        <div className="vote-counts">
          {options.map(option => (
            <div
              className={`vote-count ${option.value}`}
              key={option.value}
            >
              <strong>
                {dates.filter(
                  date =>
                    votes[date.id] === option.value
                ).length}
              </strong>

              <small>
                {option.value === 'green'
                  ? 'Available'
                  : option.value === 'yellow'
                    ? 'Flexible'
                    : 'Unavailable'}
              </small>
            </div>
          ))}
        </div>

        <div className="response-progress">
          <div
            style={{
              width: dates.length
                ? `${answered / dates.length * 100}%`
                : '0%'
            }}
          />
        </div>

        <p className="response-summary">
          {answered} of {dates.length} dates answered
        </p>

        <button
          className="primary-button auth-submit"
          onClick={saveAvailability}
          disabled={
            saving || loading || closed ||
            loadFailed || !changed
          }
        >
          {saving
            ? 'Saving...'
            : 'Save My Availability'}
        </button>

        {changed && !saving && (
          <p>You have unsaved changes.</p>
        )}

        {loading && <p>Loading your responses...</p>}

        {message && (
          <div className="auth-message" role="status">
            {message}
          </div>
        )}
      </div>
    </section>
  )
}
