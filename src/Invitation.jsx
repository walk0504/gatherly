
import { useState } from 'react'
import { supabase } from './supabase'

export default function Invitation({
  code,
  onJoined,
  onCancel
}) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function joinCircle() {
    setBusy(true)
    setMessage('')

    try {
      const { data, error } = await supabase.rpc(
        'join_circle',
        {
          invitation_code: code
        }
      )

      if (error) throw error

      onJoined(data)

    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo">gatherly.</div>

        <div className="invitation-icon">
          💌
        </div>

        <h1>You're Invited!</h1>

        <p>
          Someone wants you to join their
          Gatherly Circle.
        </p>

        <p>
          Share your availability, plan events,
          and find more time to spend together.
        </p>

        <button
          className="primary-button auth-submit"
          onClick={joinCircle}
          disabled={busy}
        >
          {busy ? 'Joining...' : 'Join Circle'}
        </button>

        {message && (
          <div className="auth-message" role="alert">
            {message}
          </div>
        )}

        <button
          className="back-button"
          onClick={onCancel}
          disabled={busy}
        >
          Not Right Now
        </button>
      </div>
    </div>
  )
}
