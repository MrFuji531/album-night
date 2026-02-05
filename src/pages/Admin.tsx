import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabaseClient'
import { useSessionData } from '../hooks/useSessionData'
import { getCurrentSong } from '../utils'
import Avatar from '../components/Avatar'

export default function Admin() {
  const { code = '' } = useParams()
  const { session, participants, songs, scores, loading, refreshAll } = useSessionData(code)
  const [title, setTitle] = useState('')
  const [paste, setPaste] = useState('')
  const [busy, setBusy] = useState(false)
  const [showSuccess, setShowSuccess] = useState<string | null>(null)

  const currentSong = useMemo(() => getCurrentSong(songs, session?.song_index ?? 0), [songs, session?.song_index])

  const submittedCount = useMemo(() => {
    if (!session) return 0
    return scores.filter(s => s.song_index === session.song_index).length
  }, [scores, session])

  const claimedCount = participants.filter(p => p.claimed).length

  function showSuccessMessage(msg: string) {
    setShowSuccess(msg)
    setTimeout(() => setShowSuccess(null), 3000)
  }

  async function saveTitle() {
    if (!session || !title.trim()) return
    setBusy(true)

    const { error } = await supabase
      .from('sessions')
      .update({ title: title.trim() })
      .eq('code', code)

    if (error) {
      alert(error.message)
    } else {
      showSuccessMessage('Title saved!')
      setTitle('')
    }
    setBusy(false)
  }

  async function importSongs() {
    if (!session) return
    setBusy(true)

    const lines = paste
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)

    // Delete existing songs
    const { error: delError } = await supabase
      .from('songs')
      .delete()
      .eq('session_code', code)

    if (delError) {
      alert(delError.message)
      setBusy(false)
      return
    }

    if (lines.length) {
      const rows = lines.map((t, i) => ({
        session_code: code,
        order_index: i,
        title: t
      }))

      const { error: insError } = await supabase.from('songs').insert(rows)
      if (insError) {
        alert(insError.message)
      } else {
        showSuccessMessage(`${lines.length} songs imported!`)
        setPaste('')
      }
    }

    await refreshAll()
    setBusy(false)
  }

  async function startAlbum() {
    if (!session || songs.length === 0) return
    setBusy(true)

    const { error } = await supabase
      .from('sessions')
      .update({ status: 'in_song', song_index: 0, locked: false })
      .eq('code', code)

    if (error) alert(error.message)
    else showSuccessMessage('Album started!')
    setBusy(false)
  }

  async function lockIn() {
    if (!session) return
    setBusy(true)

    const { error } = await supabase
      .from('sessions')
      .update({ locked: true, status: 'revealing' })
      .eq('code', code)

    if (error) alert(error.message)
    else showSuccessMessage('Scores locked!')
    setBusy(false)
  }

  async function nextSong() {
    if (!session) return
    setBusy(true)

    const songIndex = session.song_index ?? 0
    const next = songIndex + 1

    const done = next >= songs.length

    if (done) {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'results', locked: false })
        .eq('code', code)

      if (error) alert(error.message)
      else showSuccessMessage('All songs complete!')
    } else {
      const { error } = await supabase
        .from('sessions')
        .update({ song_index: next, locked: false, status: 'in_song' })
        .eq('code', code)

      if (error) alert(error.message)
      else showSuccessMessage(`Moving to song ${next + 1}`)
    }

    setBusy(false)
  }

  async function showFinalReveal() {
    if (!session) return
    setBusy(true)

    const { error } = await supabase
      .from('sessions')
      .update({ status: 'final_reveal' })
      .eq('code', code)

    if (error) alert(error.message)
    else showSuccessMessage('Starting awards!')
    setBusy(false)
  }

  async function completeSession() {
    if (!session) return
    setBusy(true)

    const { error } = await supabase
      .from('sessions')
      .update({ status: 'complete' })
      .eq('code', code)

    if (error) alert(error.message)
    else showSuccessMessage('Session complete!')
    setBusy(false)
  }

  async function resetSession() {
    if (!session) return
    if (!window.confirm('Reset entire session? This clears all scores!')) return
    setBusy(true)

    // Clear scores
    await supabase.from('scores').delete().eq('session_code', code)

    // Reset participants
    await supabase
      .from('participants')
      .update({ claimed: false, claimed_at: null })
      .eq('session_code', code)

    // Reset session
    await supabase
      .from('sessions')
      .update({ status: 'lobby', song_index: 0, locked: false })
      .eq('code', code)

    await refreshAll()
    showSuccessMessage('Session reset!')
    setBusy(false)
  }

  if (loading) {
    return (
      <div className="admin-layout">
        <div className="card text-center">
          <div className="loading-pulse h2">Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="admin-layout">
        <div className="card text-center">
          <div className="h2">Session not found</div>
          <div className="spacer" />
          <a href="#/" className="btn btn-secondary">Go Home</a>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-layout">
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000
            }}
          >
            <div className="pill pill-success" style={{ fontSize: '1rem', padding: '12px 24px' }}>
              ✓ {showSuccess}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="row" style={{ marginBottom: 24 }}>
        <div className="col">
          <div className="card">
            <div className="h1" style={{ color: 'var(--gold)' }}>Admin Panel</div>
            <div className="flex items-center gap-md">
              <div className="pill font-mono" style={{ fontSize: '1rem' }}>{code}</div>
              <div className="pill">{session.title}</div>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card">
            <div className="h3" style={{ marginBottom: 12 }}>Quick Links</div>
            <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
              <Link to={`/tv/${code}`} className="btn btn-secondary btn-sm">📺 TV View</Link>
              <Link to={`/join/${code}`} className="btn btn-secondary btn-sm">📱 Join Page</Link>
              <Link to={`/results/${code}`} className="btn btn-secondary btn-sm">📊 Results</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Left column */}
        <div className="col">
          {/* Guests */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="h3" style={{ marginBottom: 16 }}>
              Guests ({claimedCount}/4 joined)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {participants.map(p => {
                const hasSubmitted = scores.some(
                  s => s.song_index === session.song_index && s.participant_id === p.participant_id
                )

                return (
                  <div
                    key={p.participant_id}
                    className="card-inner"
                    style={{ opacity: p.claimed ? 1 : 0.5 }}
                  >
                    <div className="flex items-center gap-sm">
                      <Avatar
                        participantId={p.participant_id}
                        name={p.name}
                        avatarUrl={p.avatar_url}
                        size="sm"
                      />
                      <div>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div className="flex gap-sm" style={{ marginTop: 4 }}>
                          <span className={`pill ${p.claimed ? 'pill-success' : ''}`}>
                            {p.claimed ? 'Joined' : 'Not joined'}
                          </span>
                          {session.status === 'in_song' && (
                            <span className={`pill ${hasSubmitted ? 'pill-success' : 'pill-warning'}`}>
                              {hasSubmitted ? '✓' : '...'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Album Title */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="h3" style={{ marginBottom: 12 }}>Album Title</div>
            <input
              className="input"
              value={title}
              placeholder={session.title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="spacer" />
            <button
              className="btn btn-primary"
              onClick={saveTitle}
              disabled={busy || !title.trim()}
            >
              Save Title
            </button>
          </div>

          {/* Songs */}
          <div className="card">
            <div className="h3" style={{ marginBottom: 12 }}>
              Songs ({songs.length} tracks)
            </div>
            <p style={{ opacity: 0.7, marginBottom: 12, fontSize: '0.875rem' }}>
              Paste one song title per line. This replaces all existing songs.
            </p>
            <textarea
              className="textarea"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={`Track 1\nTrack 2\nTrack 3\n...`}
            />
            <div className="spacer" />
            <button
              className="btn btn-primary"
              onClick={importSongs}
              disabled={busy || !paste.trim()}
            >
              Import Songs
            </button>

            {songs.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: 8 }}>
                  Current tracklist:
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {songs.map((song, idx) => (
                    <div
                      key={song.id}
                      style={{
                        padding: '6px 0',
                        borderBottom: '1px solid var(--border-subtle)',
                        opacity: idx === session.song_index ? 1 : 0.6,
                        fontWeight: idx === session.song_index ? 700 : 400
                      }}
                    >
                      <span style={{ color: 'var(--gold)', marginRight: 8 }}>{idx + 1}.</span>
                      {song.title}
                      {idx === session.song_index && <span className="pill" style={{ marginLeft: 8 }}>Current</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Control Panel */}
        <div className="col">
          <div className="card card-gold">
            <div className="h2" style={{ color: 'var(--gold)', marginBottom: 16 }}>Control Panel</div>

            {/* Status display */}
            <div className="card-inner" style={{ marginBottom: 20 }}>
              <div className="flex justify-between" style={{ marginBottom: 8 }}>
                <span style={{ opacity: 0.7 }}>Status</span>
                <span className="pill">{session.status}</span>
              </div>
              <div className="flex justify-between" style={{ marginBottom: 8 }}>
                <span style={{ opacity: 0.7 }}>Song</span>
                <span className="font-mono">{(session.song_index ?? 0) + 1} / {songs.length || '—'}</span>
              </div>
              <div className="flex justify-between" style={{ marginBottom: 8 }}>
                <span style={{ opacity: 0.7 }}>Locked</span>
                <span className={`pill ${session.locked ? 'pill-warning' : 'pill-success'}`}>
                  {session.locked ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ opacity: 0.7 }}>Submitted</span>
                <span className={`pill ${submittedCount === 4 ? 'pill-success' : ''}`}>
                  {submittedCount}/4
                </span>
              </div>
            </div>

            {/* Current song */}
            {currentSong && (
              <div className="card-inner" style={{ marginBottom: 20, textAlign: 'center' }}>
                <div style={{ opacity: 0.7, fontSize: '0.75rem', marginBottom: 4 }}>NOW PLAYING</div>
                <div className="h3" style={{ color: 'var(--gold)' }}>{currentSong.title}</div>
              </div>
            )}

            {/* Control buttons */}
            <div className="flex flex-col gap-sm">
              {session.status === 'lobby' && (
                <>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={startAlbum}
                    disabled={busy || songs.length === 0}
                  >
                    🎵 Start Album {claimedCount < 4 && `(${claimedCount}/4 joined)`}
                  </button>
                  {songs.length === 0 && (
                    <div className="pill pill-warning" style={{ textAlign: 'center' }}>
                      ⚠️ Add songs first (paste tracklist above)
                    </div>
                  )}
                  {claimedCount < 4 && songs.length > 0 && (
                    <div className="pill pill-warning" style={{ textAlign: 'center' }}>
                      ⚠️ Only {claimedCount}/4 joined - you can still start!
                    </div>
                  )}
                </>
              )}

              {session.status === 'in_song' && (
                <>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={lockIn}
                    disabled={busy || submittedCount < 4}
                  >
                    🔒 Lock In Scores ({submittedCount}/4)
                  </button>
                  {submittedCount < 4 && (
                    <div className="pill" style={{ textAlign: 'center' }}>
                      Waiting for {4 - submittedCount} more score(s)...
                    </div>
                  )}
                </>
              )}

              {session.status === 'revealing' && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={nextSong}
                  disabled={busy}
                >
                {((session.song_index ?? 0) + 1 >= songs.length) ? '📊 Go to Results' : '⏭️ Next Song'}
                </button>
              )}

              {session.status === 'results' && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={showFinalReveal}
                  disabled={busy}
                >
                  🏆 Show Awards
                </button>
              )}

              {session.status === 'final_reveal' && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={completeSession}
                  disabled={busy}
                >
                  ✅ Complete Session
                </button>
              )}

              <div className="spacer" />

              <button
                className="btn btn-danger"
                onClick={resetSession}
                disabled={busy}
              >
                🔄 Reset Session
              </button>
            </div>

            {/* Help text */}
            <div style={{ marginTop: 20, fontSize: '0.8rem', opacity: 0.6 }}>
              {session.status === 'lobby' && (
                <p>Wait for all 4 guests to join, then import songs and start the album.</p>
              )}
              {session.status === 'in_song' && (
                <p>Wait for all 4 scores to be submitted, then lock them in.</p>
              )}
              {session.status === 'revealing' && (
                <p>Watch the TV for the reveal animation, then proceed to the next song.</p>
              )}
              {session.status === 'results' && (
                <p>Ready to show the awards! Click to start the final reveal.</p>
              )}
              {session.status === 'final_reveal' && (
                <p>Awards are being shown on TV. Complete when done.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
