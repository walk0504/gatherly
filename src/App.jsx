
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import Circles from './Circles'
import Events from './Events'
import './App.css'

function App() {
  const [page, setPage] = useState('Home')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError(error.message)
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, session) => {
        setSession(session)

        if (event === 'SIGNED_IN') {
          setPage('My Circles')
        }

        if (event === 'SIGNED_OUT') {
          setPage('Home')
        }
      })

    return () => subscription.unsubscribe()
  }, [])

  function navigate(destination) {
    if (destination !== 'Home' && !session) {
      setPage('Auth')
    } else {
      setPage(destination)
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setAuthError(error.message)
    } else {
      setPage('Home')
    }
  }

  if (loading) {
    return (
      <div className="auth-page">
        <h2>Loading Gatherly...</h2>
      </div>
    )
  }


  return (
    <div className="app">
      <nav className="navbar">
        <div
          className="logo"
          onClick={() => setPage('Home')}
          style={{ cursor: 'pointer' }}
        >
          gatherly.
        </div>

        <div className="nav-links">
          {['Home', 'My Circles', 'My Events'].map(item => (
            <button
              key={item}
              onClick={() => navigate(item)}
              className={page === item ? 'active' : ''}
            >
              {item}
            </button>
          ))}

          {session ? (
            <button onClick={handleLogout}>
              Log Out
            </button>
          ) : (
            <button onClick={() => setPage('Auth')}>
              Log In
            </button>
          )}
        </div>
      </nav>

      {authError && (
        <div className="auth-message" role="alert">
          {authError}
        </div>
      )}

      {page === 'Auth' && !session && (
        <Auth onBack={() => setPage('Home')} />
      )}

      {page === 'Home' && (
        <>
          <section className="hero">
            <div className="eyebrow">
              MADE FOR YOUR PEOPLE
            </div>

            <h1>
              Less planning.<br />
              More gathering.
            </h1>

            <p>
              Find the perfect day to get together.
              No more endless group texts or
              conflicting schedules.
            </p>

            <button
              className="primary-button"
              onClick={() => navigate('My Circles')}
            >
              Get Started →
            </button>
          </section>

          <section className="features">
            <h2>Getting together made simple.</h2>

            <div className="feature-grid">
              <div className="feature-card">
                <span>👥</span>
                <h3>Create a Circle</h3>
                <p>
                  Bring your family, friends, or team
                  together in one place.
                </p>
              </div>

              <div className="feature-card">
                <span>📅</span>
                <h3>Share Availability</h3>
                <p>
                  Mark your dates as available,
                  flexible, or unavailable.
                </p>
              </div>

              <div className="feature-card">
                <span>📊</span>
                <h3>Find the Best Date</h3>
                <p>
                  See which dates work for
                  the most people.
                </p>
              </div>
            </div>
          </section>

          <section className="availability">
            <h2>
              Three colors. One simple decision.
            </h2>

            <div className="status-grid">
              <div className="status green">
                🟢 I'm available!
              </div>

              <div className="status yellow">
                🟡 I can make it work.
              </div>

              <div className="status red">
                🔴 I can't make it.
              </div>
            </div>
          </section>
        </>
      )}

      {page === 'My Circles' && session && (
  <Circles session={session} />
)}
{page === 'My Events' && session && (
  <Events session={session} />
)}

      <footer>
        Gatherly · Less planning. More gathering.
      </footer>
    </div>
  )
}

export default App
