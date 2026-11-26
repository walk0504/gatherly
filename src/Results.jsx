
import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export default function Results({ event, onBack }) {
  const [members, setMembers] = useState([])
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [sortBy, setSortBy] = useState('green')

  const dates = event.event_dates || []

  async function loadResults() {
    setLoading(true)
    setError('')

    try {
      const {
        data: memberData,
        error: memberError
      } = await supabase
        .from('circle_members')
        .select('user_id, profiles(full_name)')
        .eq('circle_id', event.circle_id)

      if (memberError) throw memberError

      setMembers(memberData || [])

      const dateIds = dates.map(date => date.id)
      const allVotes = []

      for (const dateId of dateIds) {
        const { data, error } = await supabase
          .from('availability')
          .select('event_date_id, user_id, status')
          .eq('event_date_id', dateId)

        if (error) throw error

        allVotes.push(...(data || []))
      }

      setVotes(allVotes)

    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [event.id])

  const total = members.length

  const memberIds = new Set(
    members.map(member => member.user_id)
  )

  const validVotes = votes.filter(
    vote => memberIds.has(vote.user_id)
  )

  const responded = new Set(
    validVotes.map(vote => vote.user_id)
  ).size

  const completed = members.filter(member =>
    dates.length > 0 &&
    dates.every(date =>
      validVotes.some(vote =>
        vote.event_date_id === date.id &&
        vote.user_id === member.user_id
      )
    )
  ).length

  function percent(count) {
    return total
      ? Math.round(count / total * 100)
      : 0
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

  const results = dates.map(date => {
    const dateVotes = validVotes.filter(
      vote => vote.event_date_id === date.id
    )

    const green = dateVotes.filter(
      vote => vote.status === 'green'
    ).length

    const yellow = dateVotes.filter(
      vote => vote.status === 'yellow'
    ).length

    const red = dateVotes.filter(
      vote => vote.status === 'red'
    ).length

    return {
      ...date,
      green,
      yellow,
      red,
      pending: total - green - yellow - red,
      possible: green + yellow,
      dateVotes
    }
  })

  const ranked = [...results].sort((a, b) => {
    if (sortBy === 'possible') {
      return b.possible - a.possible ||
        b.green - a.green ||
        a.red - b.red ||
        a.event_date.localeCompare(b.event_date)
    }

    if (sortBy === 'red') {
      return a.red - b.red ||
        b.green - a.green ||
        b.possible - a.possible ||
        a.event_date.localeCompare(b.event_date)
    }

    return b.green - a.green ||
      b.possible - a.possible ||
      a.red - b.red ||
      a.event_date.localeCompare(b.event_date)
  })

  const best = [...results].sort((a, b) =>
    b.green - a.green ||
    b.possible - a.possible ||
    a.red - b.red ||
    a.event_date.localeCompare(b.event_date)
  )[0]

  const tiedBest = best
    ? results.filter(result =>
        result.green === best.green &&
        result.possible === best.possible &&
        result.red === best.red
      )
    : []

  const statuses = [
    { value: 'green', label: 'Available' },
    { value: 'yellow', label: 'Flexible' },
    { value: 'red', label: 'Unavailable' },
    { value: 'pending', label: 'Not answered' }
  ]

  function getMemberStatus(result, userId) {
    return result.dateVotes.find(
      vote => vote.user_id === userId
    )?.status || 'pending'
  }

  return (
    <section className="dashboard">
      <button
        className="secondary-button"
        onClick={onBack}
      >
        ← Back to Events
      </button>

      <div className="eyebrow results-eyebrow">
        FIND YOUR PERFECT DAY
      </div>

      <h1>{event.title}</h1>

      <p>
        {event.circles?.name} · Availability Results
      </p>

      <button
        className="secondary-button"
        onClick={loadResults}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Refresh Results'}
      </button>

      {error && (
        <div className="auth-message" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p>Calculating group availability...</p>
      ) : error ? (
        <p>Unable to load results. Please try again.</p>
      ) : (
        <>
          <div className="results-stats">
            <div className="result-stat">
              <strong>{total}</strong>
              <small>Total Members</small>
            </div>

            <div className="result-stat">
              <strong>{responded}</strong>
              <small>Started Responses</small>
            </div>

            <div className="result-stat">
              <strong>{completed}</strong>
              <small>Fully Responded</small>
            </div>

            <div className="result-stat">
              <strong>{total - responded}</strong>
              <small>Not Started</small>
            </div>
          </div>

          <div className="response-progress">
            <div
              style={{
                width: `${percent(completed)}%`
              }}
            />
          </div>

          <p className="response-summary">
            {percent(completed)}% of members
            have answered every date.
          </p>

          {best && best.green > 0 ? (
            <div className="recommended-date">
              <div className="eyebrow">
                {tiedBest.length > 1
                  ? 'TOP DATES — TIED'
                  : 'RECOMMENDED DATE'}
              </div>

              {tiedBest.map(date => (
                <h2 key={date.id}>
                  {formatDate(date.event_date)}
                </h2>
              ))}

              <div className="best-percentage">
                {percent(best.green)}%
              </div>

              <strong>Definitely available</strong>

              <p>
                {best.green} of {total} members
                can definitely attend.
              </p>

              <p>
                {percent(best.possible)}% could
                potentially attend, including
                flexible responses.
              </p>

              {completed < total && (
                <small>
                  Recommendation may change
                  as more people respond.
                </small>
              )}
            </div>
          ) : (
            <div className="feature-card">
              <h3>No recommended date yet</h3>
              <p>
                No dates have received a green
                response yet.
              </p>
            </div>
          )}

          <div className="results-heading">
            <h2>Ranked Availability</h2>

            <select
              aria-label="Sort results"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="green">
                Most Available
              </option>
              <option value="possible">
                Most Potential Attendees
              </option>
              <option value="red">
                Fewest Unavailable
              </option>
            </select>
          </div>

          <p>
            Percentages are based on all current
            Circle members.
          </p>

          <div className="results-list">
            {ranked.map(result => (
              <div
                key={result.id}
                className="result-card"
              >
                <div className="result-title">
                  <h3>
                    {formatDate(result.event_date)}
                  </h3>

                  <strong>
                    {percent(result.green)}%
                  </strong>
                </div>

                <div className="stacked-bar">
                  {statuses.map(status => (
                    <div
                      key={status.value}
                      className={`bar-${status.value}`}
                      style={{
                        width: total
                          ? `${result[status.value] /
                            total * 100}%`
                          : '0%'
                      }}
                    />
                  ))}
                </div>

                <div className="result-counts">
                  {statuses.map(status => (
                    <div key={status.value}>
                      <strong
                        className={
                          `count-${status.value}`
                        }
                      >
                        {result[status.value]}
                      </strong>

                      <small>{status.label}</small>

                      <small>
                        {percent(result[status.value])}%
                      </small>
                    </div>
                  ))}
                </div>

                <p>
                  <strong>
                    {percent(result.possible)}%
                  </strong>
                  {' '}could potentially attend.
                </p>

                <button
                  className="secondary-button"
                  aria-expanded={
                    expanded === result.id
                  }
                  onClick={() =>
                    setExpanded(
                      expanded === result.id
                        ? null
                        : result.id
                    )
                  }
                >
                  {expanded === result.id
                    ? 'Hide Individual Responses'
                    : 'View Individual Responses'}
                </button>

                {expanded === result.id && (
                  <div className="individual-results">
                    {statuses.map(status => (
                      <div
                        key={status.value}
                        className="individual-group"
                      >
                        <h4
                          className={
                            `count-${status.value}`
                          }
                        >
                          {status.label}
                          {' '}({result[status.value]})
                        </h4>

                        {members
                          .filter(member =>
                            getMemberStatus(
                              result,
                              member.user_id
                            ) === status.value
                          )
                          .map(member => (
                            <div
                              className="member-name"
                              key={member.user_id}
                            >
                              {member.profiles?.full_name ||
                                'Gatherly Member'}
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
