import { useMemo, useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toPng } from 'html-to-image'
import { supabase } from '../supabaseClient'
import { useSessionData } from '../hooks/useSessionData'
import { clampScore, getCurrentSong } from '../utils'
import Avatar from '../components/Avatar'
import ResultsSummary from '../components/ResultsSummary'
import type { ParticipantId } from '../types'

export default function Play() {
  const { code = '' } = useParams()
  const { session, participants, songs, scores, loading } = useSessionData(code)
  const [score, setScore] = useState(7)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const participantId = (localStorage.getItem(`albumnight:${code}:participant`) || '') as ParticipantId
  const me = useMemo(() => participants.find(p => p.participant_id === participantId) ?? null, [participants, participantId])
  const currentSong = useMemo(() => getCurrentSong(songs, session?.song_index ?? 0), [songs, session?.song_index])

  const myExisting = useMemo(() => {
    if (!session || !participantId) return null
    return scores.find(s => s.song_index === session.song_index && s.participant_id === participantId) ?? null
  }, [scores, session, participantId])

  useEffect(() => {
    if (myExisting) {
      setScore(myExisting.score)
      setSubmitted(true)
    } else {
      setSubmitted(false)
    }
  }, [myExisting, session?.song_index])

  async function submit() {
    if (!session || !participantId || session.locked) return

    const s = clampScore(score)
    setSaving(true)

    // First try to update existing score
    const { data: existing } = await supabase
      .from('scores')
      .select('id')
      .eq('session_code', code)
      .eq('song_index', session.song_index)
      .eq('participant_id', participantId)
      .maybeSingle()

    let error
    if (existing) {
      // Update existing
      const result = await supabase
        .from('scores')
        .update({ score: s })
        .eq('id', existing.id)
      error = result.error
    } else {
      // Insert new
      const result = await supabase
        .from('scores')
        .insert([{
          session_code: code,
          song_index: session.song_index,
          participant_id: participantId,
          score: s
        }])
      error = result.error
    }

    if (error) {
      alert(error.message)
    } else {
      setSubmitted(true)
    }

    setSaving(false)
  }

  async function downloadResults() {
    if (!resultRef.current) return
    setDownloading(true)

    try {
      const dataUrl = await toPng(resultRef.current, {
        quality: 0.95,
        pixelRatio: 2
      })

      const link = document.createElement('a')
      link.download = `album-night-${code}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Failed to generate image:', err)
      alert('Failed to download image')
    }

    setDownloading(false)
  }

  if (loading) {
    return (
      <div className="player-layout flex items-center justify-center">
        <div className="card text-center">
          <div className="loading-pulse h2">Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="player-layout flex items-center justify-center">
        <div className="card text-center">
          <div className="h2">Session not found</div>
          <div className="spacer" />
          <a href="#/" className="btn btn-secondary">Go Home</a>
        </div>
      </div>
    )
  }

  if (!participantId || !me) {
    return (
      <div className="player-layout flex items-center justify-center">
        <div className="card text-center" style={{ padding: 32 }}>
          <div className="h2">Who are you?</div>
          <div className="spacer" />
          <div style={{ opacity: 0.8, marginBottom: 24 }}>
            Pick your name to start rating
          </div>
          <Link className="btn btn-primary" to={`/join/${code}`}>
            Choose Your Name
          </Link>
        </div>
      </div>
    )
  }

  // Complete state - show thank you and download option
  if (session.status === 'complete') {
    return (
      <div className="player-layout">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="h1" style={{ color: 'var(--gold)', marginBottom: 16 }}>
            Thanks for Playing!
          </div>
          <div style={{ opacity: 0.8, marginBottom: 32 }}>
            {session.title}
          </div>

          <div className="card" style={{ padding: 32, marginBottom: 24 }}>
            <Avatar
              participantId={me.participant_id}
              name={me.name}
              avatarUrl={me.avatar_url}
              size="xl"
              glow
            />
            <div className="spacer" />
            <div className="h2">{me.name}</div>
          </div>

          <button
            className="btn btn-primary btn-lg w-full"
            onClick={downloadResults}
            disabled={downloading}
          >
            {downloading ? 'Generating...' : '📥 Download Results'}
          </button>

          {/* Hidden element for image generation */}
          <div style={{ position: 'absolute', left: -9999 }}>
            <ResultsSummary
              ref={resultRef}
              sessionTitle={session.title}
              participants={participants}
              songs={songs}
              scores={scores}
            />
          </div>
        </motion.div>
      </div>
    )
  }

  const isLocked = session.locked || session.status === 'revealing'
  const canSubmit = session.status === 'in_song' && !isLocked

  return (
    <div className="player-layout">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card"
        style={{ marginBottom: 16 }}
      >
        <div className="flex items-center gap-md">
          <Avatar
            participantId={me.participant_id}
            name={me.name}
            avatarUrl={me.avatar_url}
            size="sm"
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{me.name}</div>
            <div className="font-mono" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
              {code}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main scoring card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card card-glow text-center"
        style={{ padding: 32, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        {/* Status message */}
        <AnimatePresence mode="wait">
          {session.status === 'lobby' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="h2" style={{ color: 'var(--gold)' }}>Waiting to Start</div>
              <div className="spacer" />
              <div style={{ opacity: 0.7 }}>The host will begin the album soon...</div>
            </motion.div>
          )}

          {(session.status === 'in_song' || session.status === 'revealing') && currentSong && (
            <motion.div
              key={`song-${session.song_index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Song info */}
              <div className="pill" style={{ marginBottom: 16 }}>
                Track {(session.song_index ?? 0) + 1} of {songs.length}
              </div>

              <div className="h1" style={{ marginBottom: 32, lineHeight: 1.2 }}>
                {currentSong.title}
              </div>

              {/* Score display */}
              <div className="score-display" style={{ marginBottom: 24 }}>
                {clampScore(score)}
              </div>

              {/* Slider */}
              <div style={{ marginBottom: 24 }}>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={score}
                  disabled={!canSubmit}
                  onChange={(e) => setScore(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div className="flex justify-between" style={{ marginTop: 8, fontSize: '0.75rem', opacity: 0.5 }}>
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              {/* Submit button */}
              <motion.button
                whileHover={canSubmit ? { scale: 1.02 } : {}}
                whileTap={canSubmit ? { scale: 0.98 } : {}}
                className={`btn w-full ${submitted ? 'btn-secondary' : 'btn-primary'}`}
                onClick={submit}
                disabled={saving || !canSubmit}
                style={{ marginBottom: 16 }}
              >
                {saving ? 'Saving...' : submitted ? 'Update Score' : 'Submit Score'}
              </motion.button>

              {/* Status indicator */}
              <AnimatePresence>
                {submitted && !isLocked && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="pill pill-success"
                  >
                    ✓ Submitted - You can still change until locked
                  </motion.div>
                )}
                {isLocked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="pill"
                    style={{ background: 'rgba(212, 175, 55, 0.2)' }}
                  >
                    🔒 Locked - Watch the TV!
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {session.status === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="h1" style={{ color: 'var(--gold)' }}>Results Time!</div>
              <div className="spacer" />
              <div style={{ opacity: 0.7 }}>Watch the TV for the final reveal...</div>
            </motion.div>
          )}

          {session.status === 'final_reveal' && (
            <motion.div
              key="final"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="h1" style={{ color: 'var(--gold)' }}>🏆 Awards!</div>
              <div className="spacer" />
              <div style={{ opacity: 0.7 }}>Who's the Stan? Who's the Hater?</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
