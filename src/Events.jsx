
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Calendar from './Calendar'
import Availability from './Availability'
import Results from './Results'
import EventSettings from './EventSettings'

export default function Events({ session }) {
  const [circles, setCircles] = useState([])
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [resultsEvent, setResultsEvent] = useState(null)
  const [settingsEvent, setSettingsEvent] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [circleId, setCircleId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [deadline, setDeadline] = useState('')
  const [selectedDates, setSelectedDates] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  async function loadData() {
    setLoading(true)

    try {
      const { data: memberships, error: memberError } =
        await supabase
          .from('circle_members')
          .select('circle_id, role, circles(id, name)')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')

      if (memberError) throw memberError

      const adminCircles = (memberships || [])
        .map(member => member.circles)
        .filter(Boolean)

      setCircles(adminCircles)

      setCircleId(current =>
        adminCircles.some(circle => circle.id === current)
          ? current
          : adminCircles[0]?.id || ''
      )

      const { data: eventData, error: eventError } =
        await supabase
          .from('events')
          .select('*, circles(name), event_dates(id, event_date)')
          .order('created_at', { ascending: false })

      if (eventError) throw eventError

      setEvents(eventData || [])
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [session.user.id])

  function toggleDate(date) {
    setSelectedDates(previous =>
      previous.includes(date)
        ? previous.filter(item => item !== date)
        : [...previous, date].sort()
    )
  }

  function formatDate(date) {
    return new Date(`${date}T12:00:00`)
      .toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
  }

  async function createEvent(e) {
    e.preventDefault()
    setMessage('')

    if (selectedDates.length === 0) {
      setMessage('Please select at least one potential date.')
      return
    }

    setBusy(true)

    try {
      const { error } = await supabase.rpc(
        'create_event',
        {
          p_circle_id: circleId,
          p_title: title.trim(),
          p_description: description.trim(),
          p_location: location.trim(),
          p_deadline: deadline
            ? new Date(deadline).toISOString()
            : null,
          p_dates: selectedDates
        }
      )

      if (error) throw error

      setTitle('')
      setDescription('')
      setLocation('')
      setDeadline('')
      setSelectedDates([])
      setShowCreate(false)

      await loadData()
      setMessage('Your event was created!')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }
  if (settingsEvent) {
  return (
    <EventSettings
      key={settingsEvent.id}
      event={settingsEvent}
      onBack={() => {
        setSettingsEvent(null)
        loadData()
      }}
    />
  )
}
if (resultsEvent) {
  return (
    <Results
      key={resultsEvent.id}
      event={resultsEvent}
      onBack={() => {
        setResultsEvent(null)
        loadData()
      }}
    />
  )
}
  if (selectedEvent) {
  return (
    <Availability
      key={selectedEvent.id}
      event={selectedEvent}
      session={session}
      onBack={() => {
        setSelectedEvent(null)
        loadData()
      }}
    />
  )
}
  return (
    <section className="dashboard">
      <div className="eyebrow">MAKE MEMORIES</div>

      <h1>My Events</h1>

      <p>
        Find the perfect day to bring everyone together.
      </p>

      <div className="circle-actions">
        <button
          className="primary-button"
          disabled={loading || circles.length === 0}
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? 'Cancel' : '+ Create an Event'}
        </button>
      </div>

      {!loading && circles.length === 0 && (
        <p>
          You must be a Circle administrator to create events.
        </p>
      )}

      {showCreate && (
        <form
          className="circle-form event-form"
          onSubmit={createEvent}
        >
          <h2>Create an Event</h2>

          <div className="form-group">
            <label htmlFor="eventCircle">Select Circle</label>

            <select
              id="eventCircle"
              value={circleId}
              onChange={e => setCircleId(e.target.value)}
              required
            >
              {circles.map(circle => (
                <option key={circle.id} value={circle.id}>
                  {circle.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="eventName">Event Name</label>

            <input
              id="eventName"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Example: Family Christmas"
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="eventDescription">
              Description (optional)
            </label>

            <textarea
              id="eventDescription"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell everyone about your event"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="form-group">
            <label htmlFor="eventLocation">
              Location (optional)
            </label>

            <input
              id="eventLocation"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Where are we getting together?"
            />
          </div>

          <div className="form-group">
            <h3>Select Potential Dates</h3>

            <p>
              Tap each date you want your Circle to consider.
            </p>

            <Calendar
              selectedDates={selectedDates}
              onSelect={toggleDate}
            />

            <div className="selected-summary">
              <strong>
                {selectedDates.length} date(s) selected
              </strong>

              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedDates([])}
              >
                Clear
              </button>
            </div>

            <div className="selected-dates">
              {selectedDates.map(date => (
                <span key={date} className="date-tag">
                  {formatDate(date)}
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="eventDeadline">
              Response Deadline (optional)
            </label>

            <input
              id="eventDeadline"
              type="datetime-local"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>

          <button
            className="primary-button auth-submit"
            disabled={busy}
          >
            {busy ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      )}

      {message && (
        <div className="auth-message" role="status">
          {message}
        </div>
      )}

      {loading ? (
        <p>Loading your events...</p>
      ) : events.length === 0 ? (
        <div className="feature-card empty-circles">
          <span>📅</span>
          <h3>No events yet!</h3>
          <p>Create your first event to get started.</p>
        </div>
      ) : (
        <div className="circle-grid">
          {events.map(event => (
            <div className="circle-card" key={event.id}>
              <div className="circle-avatar">📅</div>

              <h2>{event.title}</h2>

              <div className="circle-role">
                {event.circles?.name}
              </div>

              <p>{event.description}</p>

              {event.location && (
                <p>📍 {event.location}</p>
              )}

              <p>
                {event.event_dates?.length || 0}
                {' '}potential dates
              </p>

              <div className="selected-dates">
                {[...(event.event_dates || [])]
                  .sort((a, b) =>
                    a.event_date.localeCompare(b.event_date)
                  )
                  .map(date => (
                    <span
                      className="date-tag"
                      key={date.id}
                    >
                      {formatDate(date.event_date)}
                    </span>
                  ))}
              </div>

              
<div className={`event-status ${event.status}`}>
  {event.status === 'finalized'
    ? '✓ Event Confirmed'
    : event.status === 'cancelled'
      ? 'Event Cancelled'
      : event.response_deadline &&
        new Date(event.response_deadline) <= new Date()
        ? 'Voting Closed'
        : 'Availability Voting Open'}
</div>

{event.status === 'finalized' && event.finalized_date && (
  <div className="confirmed-event">
    <div className="eyebrow">
      OFFICIAL EVENT DATE
    </div>

    <h3>
      {formatDate(event.finalized_date)}
    </h3>

    <p>It's official! Save the date.</p>
  </div>
)}


              {event.response_deadline && (
                <p>
                  Responses due:{' '}
                  {new Date(event.response_deadline)
                    .toLocaleString()}
                </p>
              )}
              <button
  className="primary-button auth-submit"
  onClick={() => setSelectedEvent(event)}
>
  {event.status === 'open'
    ? 'My Availability'
    : 'View My Availability'}
</button>
<button
  className="secondary-button auth-submit"
  onClick={() => setResultsEvent(event)}
>
  View Results
</button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
{circles.some(circle => circle.id === event.circle_id) && (
  <button
    className="secondary-button auth-submit"
    onClick={() => setSettingsEvent(event)}
  >
    ⚙ Manage Event
  </button>
)}