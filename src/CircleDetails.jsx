
import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export default function CircleDetails({
  circle,
  session,
  onBack
}) {
  const [details, setDetails] = useState(circle)
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(circle.name)
  const [description, setDescription] = useState(
    circle.description || ''
  )
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isAdmin = members.some(member =>
    member.user_id === session.user.id &&
    member.role === 'admin'
  )

  const isOwner =
    details.created_by === session.user.id

  async function loadDetails() {
    setLoading(true)
    setError('')

    try {
      const { data: circleData, error: circleError } =
        await supabase
          .from('circles')
          .select('*')
          .eq('id', circle.id)
          .single()

      if (circleError) throw circleError

      setDetails(circleData)
      setName(circleData.name)
      setDescription(circleData.description || '')

      const { data: memberData, error: memberError } =
        await supabase
          .from('circle_members')
          .select('user_id, role, profiles(full_name)')
          .eq('circle_id', circle.id)
          .order('joined_at')

      if (memberError) throw memberError

      setMembers(memberData || [])

      const { data: eventData, error: eventError } =
        await supabase
          .from('events')
          .select('*, event_dates(id, event_date)')
          .eq('circle_id', circle.id)
          .order('created_at', { ascending: false })

      if (eventError) throw eventError

      setEvents(eventData || [])

    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetails()
  }, [circle.id, session.user.id])

  async function runAction(
    functionName,
    parameters,
    successMessage,
    returnHome = false
  ) {
    if (busy) return

    setBusy(true)
    setMessage('')
    setError('')

    try {
      const { error } = await supabase.rpc(
        functionName,
        parameters
      )

      if (error) throw error

      if (returnHome) {
        onBack()
      } else {
        await loadDetails()
        setMessage(successMessage)
      }

      return true

    } catch (error) {
      setError(error.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function saveChanges(e) {
    e.preventDefault()

    const success = await runAction(
      'update_circle',
      {
        p_circle_id: circle.id,
        p_name: name.trim(),
        p_description: description.trim()
      },
      'Circle details updated!'
    )

    if (success) setEditing(false)
  }

  async function copyInvite() {
    const link =
      `https://joingatherly.netlify.app/?invite=${details.invite_code}`

    try {
      await navigator.clipboard.writeText(link)
      setMessage('Invitation link copied!')
    } catch {
      window.prompt('Copy your invitation link:', link)
    }
  }

  async function shareInvite() {
    const link =
      `https://joingatherly.netlify.app/?invite=${details.invite_code}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Gatherly Circle!',
          text: `Join ${details.name} on Gatherly!`,
          url: link
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
          await copyInvite()
        }
      }
    } else {
      await copyInvite()
    }
  }

  function removeMember(member) {
    const memberName =
      member.profiles?.full_name || 'this member'

    if (!window.confirm(
      `Remove ${memberName} from this Circle?`
    )) return

    runAction(
      'remove_circle_member',
      {
        p_circle_id: circle.id,
        p_user_id: member.user_id
      },
      'Member removed.'
    )
  }

  function leaveCircle() {
    if (!window.confirm(
      'Are you sure you want to leave this Circle?'
    )) return

    runAction(
      'leave_circle',
      { p_circle_id: circle.id },
      'You left the Circle.',
      true
    )
  }

  function deleteCircle() {
    const confirmation = window.prompt(
      'This permanently deletes the Circle, all its events, and all availability responses. Type DELETE to confirm.'
    )

    if (confirmation !== 'DELETE') return

    runAction(
      'delete_circle',
      { p_circle_id: circle.id },
      'Circle deleted.',
      true
    )
  }

  function resetInvitation() {
    if (!window.confirm(
      'Reset the invitation link? All previous invitation links will stop working.'
    )) return

    runAction(
      'reset_circle_invite',
      { p_circle_id: circle.id },
      'A new invitation link has been created!'
    )
  }

  function formatDate(date) {
    return new Date(`${date}T12:00:00`)
      .toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
  }

  return (
    <section className="dashboard">
      <button
        className="secondary-button"
        onClick={onBack}
        disabled={busy}
      >
        ← My Circles
      </button>

      <div className="circle-detail-header">
        <div className="circle-avatar large-avatar">
          {details.name.charAt(0).toUpperCase()}
        </div>

        <div>
          <h1>{details.name}</h1>
          <p>{details.description}</p>

          <p>
            {members.length} of 50 members
            {' · '}
            {events.length} events
          </p>
        </div>
      </div>

      {message && (
        <div className="auth-message" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="auth-message" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading Circle...</p>
      ) : error && members.length === 0 ? (
        <button
          className="secondary-button"
          onClick={loadDetails}
        >
          Try Again
        </button>
      ) : (
        <>
          <div className="circle-actions">
            <button
              className="primary-button"
              onClick={shareInvite}
              disabled={busy}
            >
              + Invite Members
            </button>

            <button
              className="secondary-button"
              onClick={copyInvite}
              disabled={busy}
            >
              Copy Invitation Link
            </button>
          </div>

          <h2>Circle Events</h2>

          {events.length === 0 ? (
            <div className="feature-card">
              <h3>No events yet</h3>
              <p>
                Events created for this Circle
                will appear here.
              </p>
            </div>
          ) : (
            <div className="circle-event-list">
              {events.map(event => (
                <div
                  className="circle-event-card"
                  key={event.id}
                >
                  <div>
                    <h3>📅 {event.title}</h3>

                    <p>
                      {event.event_dates?.length || 0}
                      {' '}potential dates
                    </p>

                    {event.finalized_date && (
                      <p>
                        Confirmed date:{' '}
                        {formatDate(event.finalized_date)}
                      </p>
                    )}

                    {event.location && (
                      <p>📍 {event.location}</p>
                    )}
                  </div>

                  <span className="circle-role">
                    {event.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p>
            Visit My Events to submit availability
            or view event results.
          </p>

          <h2>Circle Members ({members.length})</h2>

          <div className="member-list">
            {members.map(member => (
              <div
                className="member-row"
                key={member.user_id}
              >
                <div className="member-avatar">
                  {(member.profiles?.full_name || 'G')
                    .charAt(0).toUpperCase()}
                </div>

                <div className="member-info">
                  <strong>
                    {member.profiles?.full_name ||
                      'Gatherly Member'}

                    {member.user_id === session.user.id
                      ? ' (You)'
                      : ''}
                  </strong>

                  <small>
                    {member.role === 'admin'
                      ? 'Administrator'
                      : 'Member'}
                  </small>
                </div>

                {isAdmin && member.role !== 'admin' && (
                  <button
                    className="danger-button"
                    disabled={busy}
                    onClick={() => removeMember(member)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {isAdmin && (
            <div className="circle-settings">
              <h2>Circle Settings</h2>

              <div className="circle-actions">
                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => setEditing(!editing)}
                >
                  {editing ? 'Cancel Editing' : 'Edit Circle'}
                </button>

                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={resetInvitation}
                >
                  Reset Invitation Link
                </button>
              </div>

              {editing && (
                <form
                  className="circle-form"
                  onSubmit={saveChanges}
                >
                  <div className="form-group">
                    <label>Circle Name</label>

                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      maxLength={80}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>

                    <textarea
                      value={description}
                      onChange={e =>
                        setDescription(e.target.value)
                      }
                      maxLength={250}
                      rows={3}
                    />
                  </div>

                  <button
                    className="primary-button auth-submit"
                    disabled={busy}
                  >
                    Save Changes
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="danger-zone">
            {isOwner && (
              <>
                <h3>Delete Circle</h3>

                <p>
                  Permanently delete this Circle,
                  its events, and all responses.
                </p>

                <button
                  className="danger-button"
                  disabled={busy}
                  onClick={deleteCircle}
                >
                  Delete Circle
                </button>
              </>
            )}

            {!isAdmin && (
              <>
                <h3>Leave Circle</h3>

                <p>
                  You will no longer have access
                  to this Circle or its events.
                </p>

                <button
                  className="danger-button"
                  disabled={busy}
                  onClick={leaveCircle}
                >
                  Leave Circle
                </button>
              </>
            )}
          </div>
        </>
      )}
    </section>
  )
}
