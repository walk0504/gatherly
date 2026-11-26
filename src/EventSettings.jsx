
import { useState } from 'react'
import { supabase } from './supabase'

export default function EventSettings({
  event,
  onBack
}) {
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(
    event.description || ''
  )
  const [location, setLocation] = useState(
    event.location || ''
  )
  const [deadline, setDeadline] = useState(
    toLocalDateTime(event.response_deadline)
  )
  const [finalDate, setFinalDate] = useState(
    event.finalized_date || ''
  )
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState(event)

  const dates = [...(details.event_dates || [])]
    .sort((a, b) =>
      a.event_date.localeCompare(b.event_date)
    )

  function toLocalDateTime(value) {
    if (!value) return ''

    const date = new Date(value)

    date.setMinutes(
      date.getMinutes() - date.getTimezoneOffset()
    )

    return date.toISOString().slice(0, 16)
  }

  function formatDate(date) {
    return new Date(`${date}T12:00:00`)
      .toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
  }

  async function runAction(
    functionName,
    parameters,
    successMessage,
    returnHome = false
  ) {
    if (busy) return

    setBusy(true)
    setMessage('')

    try {
      const { error } = await supabase.rpc(
        functionName,
        parameters
      )

      if (error) throw error

      if (returnHome) {
        onBack()
        return
      }

      const { data, error: loadError } =
        await supabase
          .from('events')
          .select(
            '*, circles(name), event_dates(id, event_date)'
          )
          .eq('id', event.id)
          .single()

      if (loadError) {
        setMessage(
          'Changes saved, but the page could not refresh. Return to My Events.'
        )
        return
      }

      setDetails(data)
      setTitle(data.title)
      setDescription(data.description || '')
      setLocation(data.location || '')
      setDeadline(
        toLocalDateTime(data.response_deadline)
      )
      setFinalDate(data.finalized_date || '')
      setMessage(successMessage)

    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  function saveChanges(e) {
    e.preventDefault()

    runAction(
      'update_event',
      {
        p_event_id: event.id,
        p_title: title.trim(),
        p_description: description.trim(),
        p_location: location.trim(),
        p_deadline: deadline
          ? new Date(deadline).toISOString()
          : null
      },
      'Event details updated!'
    )
  }

  function finalizeEvent() {
    if (!finalDate) {
      setMessage('Please select a final date.')
      return
    }

    if (!window.confirm(
      `Confirm ${formatDate(finalDate)} as the official event date? Availability voting will close.`
    )) return

    runAction(
      'finalize_event',
      {
        p_event_id: event.id,
        p_final_date: finalDate
      },
      'Your event date is officially confirmed!'
    )
  }

  function reopenEvent() {
    if (!window.confirm(
      'Reopen voting? Previous responses will be preserved.'
    )) return

    runAction(
      'reopen_event',
      { p_event_id: event.id },
      'Availability voting has reopened!'
    )
  }

  function cancelEvent() {
    if (!window.confirm(
      'Cancel this event? Existing responses will be preserved.'
    )) return

    runAction(
      'cancel_event',
      { p_event_id: event.id },
      'Event cancelled.'
    )
  }

  function deleteEvent() {
    const confirmation = window.prompt(
      'This permanently deletes the event and all availability responses. Type DELETE to confirm.'
    )

    if (confirmation !== 'DELETE') return

    runAction(
      'delete_event',
      { p_event_id: event.id },
      'Event deleted.',
      true
    )
  }

  return (
    <section className="dashboard">

      <button
        className="secondary-button"
        onClick={onBack}
        disabled={busy}
      >
        ← Back to Events
      </button>

      <div className="eyebrow results-eyebrow">
        EVENT MANAGEMENT
      </div>

      <h1>{details.title}</h1>

      <p>{details.circles?.name}</p>

      <div className={
        `event-status ${details.status}`
      }>
        {details.status === 'finalized'
          ? '✓ Event Confirmed'
          : details.status === 'cancelled'
            ? 'Event Cancelled'
            : 'Availability Voting Open'}
      </div>

      {details.finalized_date && (
        <div className="confirmed-event">
          <div className="eyebrow">
            OFFICIAL EVENT DATE
          </div>

          <h2>
            {formatDate(details.finalized_date)}
          </h2>

          <p>
            The date is official!
            Availability voting is now closed.
          </p>
        </div>
      )}

      {message && (
        <div className="auth-message" role="status">
          {message}
        </div>
      )}

      <form
        className="circle-form settings-form"
        onSubmit={saveChanges}
      >
        <h2>Edit Event Details</h2>

        <div className="form-group">
          <label htmlFor="editTitle">Event Name</label>

          <input
            id="editTitle"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={100}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="editDescription">
            Description
          </label>

          <textarea
            id="editDescription"
            value={description}
            onChange={e =>
              setDescription(e.target.value)
            }
            maxLength={1000}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="editLocation">Location</label>

          <input
            id="editLocation"
            value={location}
            onChange={e =>
              setLocation(e.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="editDeadline">
            Response Deadline
          </label>

          <input
            id="editDeadline"
            type="datetime-local"
            value={deadline}
            onChange={e =>
              setDeadline(e.target.value)
            }
          />
        </div>

        <button
          className="primary-button auth-submit"
          disabled={busy}
        >
          Save Changes
        </button>
      </form>

      {details.status === 'open' ? (
        <div className="circle-form settings-form">
          <h2>Finalize Event Date</h2>

          <p>
            Review your group's results, then
            choose the official event date.
          </p>

          <div className="final-date-options">
            {dates.map(date => (
              <label
                key={date.id}
                className={
                  `final-date-option ${
                    finalDate === date.event_date
                      ? 'chosen'
                      : ''
                  }`
                }
              >
                <input
                  type="radio"
                  name="finalDate"
                  value={date.event_date}
                  checked={
                    finalDate === date.event_date
                  }
                  onChange={e =>
                    setFinalDate(e.target.value)
                  }
                  disabled={busy}
                />

                <strong>
                  {formatDate(date.event_date)}
                </strong>
              </label>
            ))}
          </div>

          <button
            className="primary-button auth-submit"
            disabled={busy || !finalDate}
            onClick={finalizeEvent}
          >
            Confirm Event Date
          </button>
        </div>
      ) : (
        <div className="circle-form settings-form">
          <h2>Reopen Availability Voting</h2>

          <p>
            If plans have changed, reopen voting
            so everyone can update their responses.
          </p>

          <button
            className="secondary-button"
            onClick={reopenEvent}
            disabled={busy}
          >
            Reopen Voting
          </button>
        </div>
      )}

      <div className="danger-zone">

        {details.status !== 'cancelled' && (
          <>
            <h3>Cancel Event</h3>

            <p>
              Cancel this event without deleting
              previous availability responses.
            </p>

            <button
              className="danger-button"
              onClick={cancelEvent}
              disabled={busy}
            >
              Cancel Event
            </button>

            <hr />
          </>
        )}

        <h3>Delete Event</h3>

        <p>
          Permanently delete this event and
          all associated availability responses.
        </p>

        <button
          className="danger-button"
          onClick={deleteEvent}
          disabled={busy}
        >
          Delete Event
        </button>
      </div>
    </section>
  )
}
