
import { useState } from 'react'
import { supabase } from './supabase'

export default function Auth({ onBack }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const cleanUsername = username.trim().toLowerCase()

      const legacyLogin =
        !isSignUp && cleanUsername.includes('@')

      if (
        !legacyLogin &&
        !/^[a-z0-9_]{3,30}$/.test(cleanUsername)
      ) {
        throw new Error(
          'Username must be 3–30 characters using letters, numbers, or underscores.'
        )
      }

      const internalEmail = legacyLogin
        ? cleanUsername
        : `${cleanUsername}@gatherly.invalid`

      if (isSignUp) {
        if (!fullName.trim()) {
          throw new Error('Please enter your name.')
        }

        const { data, error } =
          await supabase.auth.signUp({
            email: internalEmail,
            password,
            options: {
              data: {
                full_name: fullName.trim(),
                username: cleanUsername
              }
            }
          })

        if (error) throw error

        if (!data.session) {
          setMessage(
            'Unable to sign in automatically. Please contact the administrator.'
          )
        }

      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: internalEmail,
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
          {isSignUp
            ? 'Create your account'
            : 'Welcome back!'}
        </h1>

        <p>
          {isSignUp
            ? 'Your people. Your plans. No email required.'
            : 'More time together starts here.'}
        </p>

        <form onSubmit={handleSubmit}>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="fullName">
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={e =>
                  setFullName(e.target.value)
                }
                placeholder="Enter your name"
                autoComplete="name"
                maxLength={100}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={e =>
                setUsername(e.target.value)
              }
              placeholder={
                isSignUp
                  ? 'Choose a username'
                  : 'Enter your username'
              }
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
            />

            {isSignUp && (
              <small>
                Use letters, numbers, or underscores.
                No spaces.
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={e =>
                setPassword(e.target.value)
              }
              placeholder="Enter your password"
              autoComplete={
                isSignUp
                  ? 'new-password'
                  : 'current-password'
              }
              minLength={8}
              required
            />

            {isSignUp && (
              <small>
                Use at least 8 characters.
              </small>
            )}
          </div>

          {isSignUp && (
            <p className="password-notice">
              Please remember your username and
              password. Email is not required,
              and password recovery is not
              available yet.
            </p>
          )}

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
          <div
            className="auth-message"
            role="status"
          >
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
