
import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export default function Circles({ session }) {
  const [circles, setCircles] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  async function loadCircles() {
    setLoading(true)

    const { data, error } = await supabase
      .from('circles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
    } else {
      setCircles(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadCircles()
  }, [session.user.id])

  async function createCircle(e) {
    e.preventDefault()
    setMessage('')
    setBusy(true)

    try {
      const { error } = await supabase.rpc(
        'create_circle',
        {
          circle_name: name.trim(),
          circle_description: description.trim()
        }
      )

      if (error) throw error

      setName('')
      setDescription('')
      setShowCreate(false)
      await loadCircles()
      setMessage('Your Circle was created!')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function joinCircle(e) {
    e.preventDefault()
    setMessage('')
    setBusy(true)

    try {
      const { error } = await supabase.rpc(
        'join_circle',
        {
          invitation_code: inviteCode.trim()
        }
      )

      if (error) throw error

      setInviteCode('')
      setShowJoin(false)
      await loadCircles()
      setMessage('You joined the Circle!')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function copyInvite(code) {
    try {
      await navigator.clipboard.writeText(code)
      setMessage('Invitation code copied!')
    } catch {
      setMessage('Unable to copy. Select the code manually.')
    }
  }

  return (
    <section className="dashboard">
      <div className="eyebrow">YOUR PEOPLE</div>
      <h1>My Circles</h1>
      <p>Keep your favorite people connected.</p>

      <div className="circle-actions">
        <button
          className="primary-button"
          onClick={() => {
            setShowCreate(!showCreate)
            setShowJoin(false)
          }}
        >
          + Create a Circle
        </button>

        <button
          className="secondary-button"
          onClick={() => {
            setShowJoin(!showJoin)
            setShowCreate(false)
          }}
        >
          Join a Circle
        </button>
      </div>

      {showCreate && (
        <form
          className="circle-form"
          onSubmit={createCircle}
        >
          <h2>Create a Circle</h2>

          <div className="form-group">
            <label htmlFor="circleName">
              Circle Name
            </label>

            <input
              id="circleName"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Example: Family"
              maxLength={80}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="circleDescription">
              Description (optional)
            </label>

            <input
              id="circleDescription"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell us about your Circle"
              maxLength={250}
            />
          </div>

          <button
            className="primary-button auth-submit"
            disabled={busy}
          >
            {busy ? 'Creating...' : 'Create Circle'}
          </button>
        </form>
      )}

      {showJoin && (
        <form
          className="circle-form"
          onSubmit={joinCircle}
        >
          <h2>Join a Circle</h2>

          <p>
            Enter the invitation code shared with you.
          </p>

          <div className="form-group">
            <label htmlFor="inviteCode">
              Invitation Code
            </label>

            <input
              id="inviteCode"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              placeholder="Paste invitation code"
              required
            />
          </div>

          <button
            className="primary-button auth-submit"
            disabled={busy}
          >
            {busy ? 'Joining...' : 'Join Circle'}
          </button>
        </form>
      )}

      {message && (
        <div className="auth-message" role="status">
          {message}
        </div>
      )}

      {loading ? (
        <p>Loading your Circles...</p>
      ) : circles.length === 0 ? (
        <div className="feature-card empty-circles">
          <span>👥</span>
          <h3>No Circles yet!</h3>
          <p>Create or join your first Circle to get started.</p>
        </div>
      ) : (
        <div className="circle-grid">
          {circles.map(circle => (
            <div className="circle-card" key={circle.id}>
              <div className="circle-avatar">
                {circle.name.charAt(0).toUpperCase()}
              </div>

              <h2>{circle.name}</h2>
              <p>{circle.description || 'Your private Circle'}</p>

              <div className="circle-role">
                {circle.created_by === session.user.id
                  ? 'Circle Owner'
                  : 'Circle Member'}
              </div>

              <div className="invite-section">
                <strong>Invitation Code</strong>
                <div className="invite-code">
                  {circle.invite_code}
                </div>

                <button
                  className="secondary-button"
                  onClick={() => copyInvite(circle.invite_code)}
                >
                  Copy Invitation Code
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
