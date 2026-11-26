
import { useState } from 'react'
import { supabase } from './supabase'

export default function Auth({ onBack, inviteCode }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim()
            },
            emailRedirectTo: inviteCode
  ? `${window.location.origin}/?invite=${encodeURIComponent(inviteCode)}`
  : window.location.origin
          }
        })

        if (error) throw error

        if (!data.session) {
          setMessage('Check your email to confirm your account!')
        }
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email,
            password
          })

        if (error) throw error
      }
    } catch (error) {
      setMessage(error.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo">gatherly.</div>

        <h1>
          {isSignUp ? 'Create your account' : 'Welcome back!'}
        </h1>

        <p>
          {isSignUp
            ? 'Bring your favorite people together.'
            : 'Your people. Your plans. All in one place.'}
        </p>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              minLength={8}
              required
            />
          </div>

          <button
            className="primary-button auth-submit"
            disabled={loading}
            type="submit"
          >
            {loading
              ? 'Please wait...'
              : isSignUp
                ? 'Create Account'
                : 'Log In'}
          </button>
        </form>

        {message && (
          <div className="auth-message" role="status">
            {message}
          </div>
        )}

        <p className="auth-switch">
          {isSignUp
            ? 'Already have an account?'
            : "Don't have an account?"}

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setIsSignUp(!isSignUp)
              setMessage('')
            }}
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </p>

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  )
}
