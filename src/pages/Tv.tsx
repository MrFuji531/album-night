import { useMemo, useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeCanvas } from 'qrcode.react'
import { useSessionData } from '../hooks/useSessionData'
import { useConfetti } from '../hooks/useConfetti'
import { useAudio } from '../hooks/useAudio'
import { getCurrentSong, computeSongAvg, calculateAwards } from '../utils'
import Avatar from '../components/Avatar'
import ScoreReveal from '../components/ScoreReveal'
import AverageFlip from '../components/AverageFlip'
import AwardReveal from '../components/AwardReveal'
import type { ParticipantId, Participant, Song } from '../types'

type RevealStage = 'idle' | 'countdown' | 'rising' | 'final'

const DESIGN_W = 1920
const DESIGN_H = 1080

export default function Tv() {
  const { code = '' } = useParams()
  const { session, participants, songs, scores, loading } = useSessionData(code)
  const { celebrate, fireworks } = useConfetti()

  // your hook currently supports unlock (based on your earlier TV file)
  const { preloadCommon, playScoreReaction, unlock } = useAudio()

  const [revealStage, setRevealStage] = useState<RevealStage>('idle')
  const [awardRevealComplete, setAwardRevealComplete] = useState(false)

  const [scale, setScale] = useState(1)
  const playedAudioRef = useRef(false)

  const [averageFlipping, setAverageFlipping] = useState(false)
  const [liveAverage, setLiveAverage] = useState(0)

  /* ------------------ TV MODE ------------------ */
  useEffect(() => {
    document.body.classList.add('tv-mode')
    return () => document.body.classList.remove('tv-mode')
  }, [])

  // Safe-scale: avoid Firestick/Silk overscan + chrome clipping bottom
  useEffect(() => {
    const onResize = () => {
      const availW = document.documentElement.clientWidth
      const availH = document.documentElement.clientHeight

      const safe = 0.94 // TV safe area
      const s = Math.min(availW / DESIGN_W, availH / DESIGN_H) * safe
      setScale(s)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /* ------------------ DATA ------------------ */
  const songIndex = session?.song_index ?? 0

  const currentSong = useMemo(
    () => getCurrentSong(songs, songIndex),
    [songs, songIndex]
  )

  const songScores = useMemo(() => {
    if (!session) return []
    return scores.filter(s => s.song_index === session.song_index)
  }, [scores, session])

  const scoreMap = useMemo(() => {
    const m: Partial<Record<ParticipantId, number>> = {}
    for (const r of songScores) m[r.participant_id] = r.score
    return m
  }, [songScores])

  const songAvg = computeSongAvg(songScores)

  const submittedCount = useMemo(() => {
    if (!session) return 0
    return scores.filter(s => s.song_index === session.song_index).length
  }, [scores, session])

  const joinedCount = participants.filter(p => p.claimed).length
  const allJoined = joinedCount === 4

  const awards = useMemo(() => {
    const data = calculateAwards(participants, scores, songs)
    const awardList: Array<{
      id: string
      title: string
      subtitle: string
      icon: string
      value: string | number
      participant?: Participant
      song?: Song
    }> = []

    if (data.stan) {
      awardList.push({
        id: 'stan',
        title: 'THE STAN',
        subtitle: 'Highest average rating',
        icon: '🏆',
        value: data.stan.avg,
        participant: data.stan.participant
      })
    }

    if (data.hater) {
      awardList.push({
        id: 'hater',
        title: 'THE HATER',
        subtitle: 'Lowest average rating',
        icon: '🧊',
        value: data.hater.avg,
        participant: data.hater.participant
      })
    }

    return awardList
  }, [participants, scores, songs])

      const albumAvg = useMemo(() => {
      const data = calculateAwards(participants, scores, songs)
      return data.albumAvg ?? 0
    }, [participants, scores, songs])

    const personAverages = useMemo(() => {
      const data = calculateAwards(participants, scores, songs)
      return data.personAverages
    }, [participants, scores])


  /* ------------------ AUDIO ------------------ */
  useEffect(() => {
    preloadCommon()
  }, [preloadCommon])

  useEffect(() => {
    const handler = () => unlock()
    window.addEventListener('pointerdown', handler, { once: true })
    window.addEventListener('keydown', handler, { once: true })
    return () => {
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [unlock])

  /* ------------------ REVEAL FLOW ------------------ */
  useEffect(() => {
    if (!session) return

    if (session.status === 'revealing') {
      setRevealStage('countdown')
      setAverageFlipping(false)
      setLiveAverage(0)
      playedAudioRef.current = false

      const t = window.setTimeout(() => {
        setRevealStage('rising')
        setAverageFlipping(true)
      }, 700)

      return () => window.clearTimeout(t)
    }
  }, [session?.status, session?.song_index])

  const handleTick = (currentScores: Record<string, number>) => {
    const vals = Object.values(currentScores)
    const sum = vals.reduce((a, b) => a + b, 0)
    const avg = sum / (participants.length || 4)
    setLiveAverage(avg)
  }

  const handleRevealComplete = () => {
    setAverageFlipping(false)
    setRevealStage('final')
    celebrate()

    if (!playedAudioRef.current) {
      playedAudioRef.current = true
      playScoreReaction(Math.round(songAvg))
    }
  }

  const handleAwardsComplete = () => {
    setAwardRevealComplete(true)
    fireworks()
  }

  /* ------------------ JOIN URL ------------------ */
  const joinUrl = useMemo(() => {
    const base = import.meta.env.BASE_URL || './'
    const normalizedBase = base.startsWith('/') ? base : `/${base.replace(/^\.\//, '')}`
    return `${window.location.origin}${normalizedBase}#/join/${code}`
  }, [code])

  /* ------------------ STATES ------------------ */
  if (loading) {
    return (
      <div className="tv-layout">
        <div className="tv-content">
          <div className="text-center">
            <div className="loading-pulse h1">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="tv-layout">
        <div className="tv-content">
          <div className="card text-center">
            <div className="h2">Session not found</div>
            <div className="spacer" />
            <a href="#/" className="btn btn-secondary">Go Home</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="tv-layout"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      {/* Scaled fixed stage */}
      <div
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          overflow: 'hidden'
        }}
      >
        {/* IMPORTANT: stage column that can never overflow 1080 */}
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            className="tv-header"
            style={{
              flex: '0 0 auto',
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div className="h2" style={{ color: 'var(--gold)', marginBottom: 0 }}>{session.title}</div>
              <div className="font-mono" style={{ opacity: 0.6 }}>{code}</div>
            </div>
            <div className="flex gap-sm">
              <Link to={`/admin/${code}`} className="btn btn-ghost btn-sm">Admin</Link>
              <Link to={`/results/${code}`} className="btn btn-ghost btn-sm">Results</Link>
            </div>
          </div>

          {/* Content (override your CSS center-align) */}
          <div
            className="tv-content"
            style={{
              flex: '1 1 auto',
              minHeight: 0,
              overflow: 'hidden',
              padding: '14px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start' // overrides your CSS "center"
            }}
          >
            <AnimatePresence mode="wait">

              {/* LOBBY */}
              {session.status === 'lobby' && (
                <motion.div
                  key="lobby"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    height: '100%',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 18,
                    alignItems: 'stretch'
                  }}
                >
                  <div className="card card-glow text-center" style={{ padding: 26 }}>
                    <div className="h2" style={{ marginBottom: 14 }}>Scan to Join</div>
                    <div className="qr-container">
                      <QRCodeCanvas
                        value={joinUrl}
                        size={250}
                        fgColor="#D4AF37"
                        bgColor="#0a0f0a"
                        level="M"
                      />
                    </div>
                    <div className="spacer" />
                    <div className="font-mono" style={{ opacity: 0.7, fontSize: '0.95rem', wordBreak: 'break-all' }}>
                      {joinUrl}
                    </div>
                  </div>

                  <div className="card" style={{ padding: 26, overflow: 'hidden' }}>
                    <div className="h2" style={{ marginBottom: 14 }}>
                      Waiting for guests… ({joinedCount}/4)
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 14
                      }}
                    >
                      {participants.map((p) => (
                        <div
                          key={p.participant_id}
                          className="card-inner"
                          style={{ opacity: p.claimed ? 1 : 0.5 }}
                        >
                          <div className="flex items-center gap-md">
                            <Avatar
                              participantId={p.participant_id}
                              name={p.name}
                              avatarUrl={p.avatar_url}
                              size="lg"
                              glow={p.claimed}
                            />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{p.name}</div>
                              <div className={`pill ${p.claimed ? 'pill-success' : ''}`}>
                                {p.claimed ? '✓ Joined' : 'Waiting…'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {allJoined && (
                      <div style={{ marginTop: 14 }} className="pill pill-success">
                        ✓ All joined! Admin can start the album
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* IN SONG */}
              {session.status === 'in_song' && (
                <motion.div
                  key={`song-${songIndex}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    alignItems: 'center'
                  }}
                >
                  <div className="pill">
                    Track {songIndex + 1} of {songs.length}
                  </div>

                  <div className="h1" style={{ margin: 0 }}>
                    {currentSong?.title ?? 'Loading…'}
                  </div>

                  <div
                    className="grid-4"
                    style={{
                      width: '100%',
                      maxWidth: 1500,
                      marginTop: 10
                    }}
                  >
                    {participants.map((p) => {
                      const hasSubmitted = songScores.some(s => s.participant_id === p.participant_id)
                      return (
                        <div
                          key={p.participant_id}
                          className="card text-center"
                          style={{ padding: 18 }}
                        >
                          <Avatar
                            participantId={p.participant_id}
                            name={p.name}
                            avatarUrl={p.avatar_url}
                            size="lg"
                            glow={hasSubmitted}
                          />
                          <div className="spacer" />
                          <div style={{ fontWeight: 700 }}>{p.name}</div>
                          <div className="spacer" />
                          <div className={`pill ${hasSubmitted ? 'pill-success' : 'pill-warning'}`}>
                            {hasSubmitted ? '✓ Submitted' : '⏳ Waiting'}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Bottom status - no spacer-xl, keep it always visible */}
                  <div style={{ marginTop: 'auto', paddingBottom: 4 }}>
                    <div className="pill" style={{ fontSize: '1rem', padding: '12px 24px' }}>
                      {submittedCount}/4 submitted
                      {submittedCount === 4 && ' — Admin can lock in!'}
                    </div>
                  </div>
                </motion.div>
              )}
{/* REVEALING */}
{session.status === 'revealing' && (
  <motion.div
    key="revealing"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      overflow: 'hidden'
    }}
  >
    {/* Top: track + title */}
    <div style={{ flex: '0 0 auto' }} className="text-center">
      <div className="pill" style={{ marginBottom: 10 }}>
        Track {songIndex + 1} of {songs.length}
      </div>
      <div className="h1" style={{ margin: 0 }}>
        {currentSong?.title ?? ''}
      </div>
      {revealStage === 'countdown' && (
        <div className="h2" style={{ color: 'var(--gold)', marginTop: 10 }}>
          Scores locked in…
        </div>
      )}
    </div>

    {(revealStage === 'rising' || revealStage === 'final') && (
      <>
        {/* Row 1: Avatars - always visible */}
        <div style={{ flex: '0 0 auto' }}>
          <div
            className="grid-4"
            style={{
              maxWidth: 1500,
              margin: '0 auto',
              gap: 16
            }}
          >
            {participants.map(p => (
              <div key={p.participant_id} className="card-inner text-center" style={{ padding: 12 }}>
                <Avatar
                  participantId={p.participant_id}
                  name={p.name}
                  avatarUrl={p.avatar_url}
                  size="lg"
                  glow
                />
                <div style={{ marginTop: 8, fontWeight: 700 }}>{p.name}</div>
                <div style={{ marginTop: 6 }}>
                  <span className="pill pill-success">✓ Locked</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Bars - gets most height */}
        <div
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <div style={{ width: '100%', maxWidth: 1500 }}>
            <ScoreReveal
              key={`reveal-${songIndex}`}
              participants={participants}
              scoreMap={scoreMap}
              startReveal={revealStage === 'rising'}
              onTick={handleTick}
              onComplete={handleRevealComplete}
            />
          </div>
        </div>

        {/* Row 3: Average - dedicated area */}
        <div style={{ flex: '0 0 auto' }} className="text-center">
          <AverageFlip
            value={averageFlipping ? liveAverage : songAvg}
            isFlipping={averageFlipping}
          />
        </div>

        {revealStage === 'final' && (
          <div style={{ flex: '0 0 auto' }} className="text-center">
            <div className="pill" style={{ fontSize: '1rem', padding: '10px 18px' }}>
              Admin: Press “Next Song” to continue
            </div>
          </div>
        )}
      </>
    )}
  </motion.div>
)}


              {/* RESULTS WAIT */}
              {session.status === 'results' && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 14
                  }}
                  className="text-center"
                >
                  <div className="h1" style={{ color: 'var(--gold)' }}>
                    All Songs Complete!
                  </div>
                  <div className="h2">
                    Ready for the final results?
                  </div>
                  <div className="pill" style={{ fontSize: '1rem', padding: '12px 24px' }}>
                    Admin: Press “Show Awards” to reveal
                  </div>
                </motion.div>
              )}

{/* FINAL REVEAL */}
{session.status === 'final_reveal' && (
  <motion.div
    key="final_reveal"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{ height: '100%', overflow: 'hidden' }}
  >
    {!awardRevealComplete ? (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        {/* Header */}
        <div className="text-center" style={{ flex: '0 0 auto' }}>
          <div className="h1" style={{ color: 'var(--gold)', margin: 0 }}>FINAL RESULTS</div>
          <div className="pill" style={{ marginTop: 10 }}>
            Album Average: {albumAvg ? albumAvg.toFixed(2) : '—'}
          </div>
        </div>

        {/* Leaderboard row */}
        <div style={{ flex: '0 0 auto' }}>
          <div className="grid-4" style={{ maxWidth: 1500, margin: '0 auto', gap: 16 }}>
            {participants.map(p => (
              <div key={p.participant_id} className="card text-center" style={{ padding: 18 }}>
                <Avatar
                  participantId={p.participant_id}
                  name={p.name}
                  avatarUrl={p.avatar_url}
                  size="lg"
                  glow
                />
                <div style={{ marginTop: 10, fontWeight: 800, fontSize: '1.25rem' }}>{p.name}</div>
                <div style={{ marginTop: 10 }} className="score-medium">
                  {(personAverages?.[p.participant_id] ?? 0).toFixed(2)}
                </div>
                <div style={{ opacity: 0.65, marginTop: 2 }}>average</div>
              </div>
            ))}
          </div>
        </div>

        {/* Awards reveal takes remaining space */}
        <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
          <AwardReveal awards={awards} onComplete={handleAwardsComplete} />
        </div>

        {/* Footer prompt */}
        <div className="text-center" style={{ flex: '0 0 auto' }}>
          <div className="pill" style={{ fontSize: '1rem', padding: '10px 18px' }}>
            Admin: Press “Complete Session” when done
          </div>
        </div>
      </div>
    ) : (
      <div
        className="text-center"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 14
        }}
      >
        <div className="h1" style={{ color: 'var(--gold)' }}>🎉 That’s a wrap!</div>
        <div className="h2">{session.title}</div>
        <div className="pill" style={{ fontSize: '1rem', padding: '12px 24px' }}>
          Admin: Press “Complete Session” to finish
        </div>
      </div>
    )}
  </motion.div>
)}


              {/* COMPLETE */}
              {session.status === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 14
                  }}
                >
                  <div className="h1" style={{ color: 'var(--gold)' }}>
                    Thanks for listening!
                  </div>
                  <div className="h2">
                    {session.title}
                  </div>
                  <Link to={`/results/${code}`} className="btn btn-primary btn-lg">
                    View Full Results
                  </Link>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
