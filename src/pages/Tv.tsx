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

  const { preloadCommon, playScoreReaction, unlock, preload } = useAudio()

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

  // Safe-scale for Firestick/TV overscan
  useEffect(() => {
    const onResize = () => {
      const availW = document.documentElement.clientWidth
      const availH = document.documentElement.clientHeight

      const safe = 0.85 // More aggressive safe area for TV overscan
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

    // Award 1: The Stan (highest average rater)
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

    // Award 2: The Hater (lowest average rater)
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

    // Award 3: Best Song (highest rated song)
    if (data.highestRated) {
      awardList.push({
        id: 'highest',
        title: 'BEST SONG',
        subtitle: 'Highest rated track',
        icon: '🔥',
        value: data.highestRated.avg,
        song: data.highestRated.song
      })
    }

    // Award 4: Worst Song (lowest rated song)
    if (data.lowestRated) {
      awardList.push({
        id: 'lowest',
        title: 'WORST SONG',
        subtitle: 'Lowest rated track',
        icon: '❄️',
        value: data.lowestRated.avg,
        song: data.lowestRated.song
      })
    }

    // Award 5: Most Divisive (biggest spread in scores)
    if (data.mostDivisive) {
      awardList.push({
        id: 'divisive',
        title: 'MOST DIVISIVE',
        subtitle: 'Biggest disagreement',
        icon: '⚡',
        value: `±${data.mostDivisive.spread}`,
        song: data.mostDivisive.song
      })
    }

    return awardList
  }, [participants, scores, songs])

  const albumAvg = useMemo(() => {
    const data = calculateAwards(participants, scores, songs)
    return data.albumAvg ?? 0
  }, [participants, scores, songs])

  /* ------------------ AUDIO ------------------ */
  useEffect(() => {
    preloadCommon()
    // Preload award sounds
    preload('award_stan')
    preload('award_hater')
    preload('award_highest')
    preload('award_lowest')
    preload('award_divisive')
    preload('drumroll')
    preload('fanfare')
  }, [preloadCommon, preload])

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
    return `${window.location.origin}${normalizedBase}/album-night/#/join/${code}`
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
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-deep)'
      }}
    >
      {/* Scaled fixed stage - centered */}
      <div
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: 48
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
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Mini header for lobby only */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 24 
              }}>
                <div>
                  <div className="h2" style={{ color: 'var(--gold)', fontSize: '1.5rem' }}>
                    {session.title}
                  </div>
                  <div className="font-mono" style={{ opacity: 0.6 }}>{code}</div>
                </div>
                <div className="flex gap-sm">
                  <Link to={`/admin/${code}`} className="btn btn-ghost btn-sm">Admin</Link>
                  <Link to={`/results/${code}`} className="btn btn-ghost btn-sm">Results</Link>
                </div>
              </div>

              <div style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 32,
                alignItems: 'center'
              }}>
                <div className="card card-glow text-center" style={{ padding: 40 }}>
                  <div className="h2" style={{ marginBottom: 24 }}>Scan to Join</div>
                  <div className="qr-container">
                    <QRCodeCanvas
                      value={joinUrl}
                      size={300}
                      fgColor="#D4AF37"
                      bgColor="#0a0f0a"
                      level="M"
                    />
                  </div>
                  <div className="spacer-lg" />
                  <div className="font-mono" style={{ opacity: 0.7, fontSize: '1rem', wordBreak: 'break-all' }}>
                    {joinUrl}
                  </div>
                </div>

                <div className="card" style={{ padding: 40 }}>
                  <div className="h2" style={{ marginBottom: 24 }}>
                    Waiting for guests… ({joinedCount}/4)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {participants.map((p) => (
                      <div
                        key={p.participant_id}
                        className="card-inner"
                        style={{ opacity: p.claimed ? 1 : 0.5, padding: 24 }}
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
                            <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{p.name}</div>
                            <div className={`pill ${p.claimed ? 'pill-success' : ''}`} style={{ marginTop: 8 }}>
                              {p.claimed ? '✓ Joined' : 'Waiting…'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {allJoined && (
                    <div style={{ marginTop: 24 }} className="pill pill-success">
                      ✓ All joined! Let's begin, ahhhh I'm nervous
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* IN SONG - Waiting for scores */}
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
                alignItems: 'center',
                justifyContent: 'center',
                gap: 32
              }}
            >
              <div className="pill" style={{ fontSize: '1.25rem', padding: '12px 24px' }}>
                Track {songIndex + 1} of {songs.length}
              </div>

              <div className="h1" style={{ margin: 0, textAlign: 'center' }}>
                {currentSong?.title ?? 'Loading…'}
              </div>

              <div className="spacer-lg" />

              <div className="grid-4" style={{ width: '100%', maxWidth: 1200 }}>
                {participants.map((p) => {
                  const hasSubmitted = songScores.some(s => s.participant_id === p.participant_id)
                  return (
                    <div
                      key={p.participant_id}
                      className="card text-center"
                      style={{ padding: 28 }}
                    >
                      <Avatar
                        participantId={p.participant_id}
                        name={p.name}
                        avatarUrl={p.avatar_url}
                        size="lg"
                        glow={hasSubmitted}
                      />
                      <div style={{ marginTop: 16, fontWeight: 700, fontSize: '1.25rem' }}>{p.name}</div>
                      <div style={{ marginTop: 12 }}>
                        <span className={`pill ${hasSubmitted ? 'pill-success' : 'pill-warning'}`}>
                          {hasSubmitted ? '✓ Submitted' : '⏳ Waiting'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="spacer-lg" />

              <div className="pill" style={{ fontSize: '1.25rem', padding: '14px 28px' }}>
                {submittedCount}/4 submitted
                {submittedCount === 4 && ' — lock in baby!'}
              </div>
            </motion.div>
          )}

          {/* REVEALING - Score bars rising */}
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
                overflow: 'hidden'
              }}
            >
              {/* Track info - compact at top */}
              <div style={{ flex: '0 0 auto', textAlign: 'center', marginBottom: 16 }}>
                <div className="pill" style={{ marginBottom: 8 }}>
                  Track {songIndex + 1} of {songs.length}
                </div>
                <div className="h1" style={{ margin: 0, fontSize: '2.5rem' }}>
                  {currentSong?.title ?? ''}
                </div>
                {revealStage === 'countdown' && (
                  <div className="h2" style={{ color: 'var(--gold)', marginTop: 8 }}>
                    Scores locked in…
                  </div>
                )}
              </div>

              {(revealStage === 'rising' || revealStage === 'final') && (
                <>
                  {/* Bars section - takes most of the space */}
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
                    <ScoreReveal
                      key={`reveal-${songIndex}`}
                      participants={participants}
                      scoreMap={scoreMap}
                      startReveal={revealStage === 'rising'}
                      onTick={handleTick}
                      onComplete={handleRevealComplete}
                    />
                  </div>

                  {/* Average - fixed at bottom */}
                  <div style={{ flex: '0 0 auto', textAlign: 'center', paddingTop: 16 }}>
                    <AverageFlip
                      value={averageFlipping ? liveAverage : songAvg}
                      isFlipping={averageFlipping}
                    />
                  </div>

                  {revealStage === 'final' && (
                    <div style={{ flex: '0 0 auto', textAlign: 'center', paddingTop: 12 }}>
                      <div className="pill" style={{ fontSize: '1rem', padding: '10px 20px' }}>
                        Onto the next one!
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
                gap: 24
              }}
              className="text-center"
            >
              <div className="h1" style={{ color: 'var(--gold)' }}>
                Don't worry Lee we're now done, the pain is over
              </div>
              <div className="h2">
                Ready for the final results?
              </div>
              <div className="pill" style={{ fontSize: '1.25rem', padding: '14px 28px' }}>
                Click show Awards pls
              </div>
            </motion.div>
          )}

          {/* FINAL REVEAL - Full screen awards */}
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
                    flexDirection: 'column'
                  }}
                >
                  {/* Awards take the FULL screen */}
                  <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
                    <AwardReveal awards={awards} onComplete={handleAwardsComplete} />
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
                    gap: 32
                  }}
                >
                  <div style={{ fontSize: '6rem', marginBottom: 16 }}>🎉</div>
                  <div style={{ 
                    fontFamily: 'var(--font-display)',
                    fontSize: '4rem',
                    color: 'var(--gold)',
                    textTransform: 'uppercase'
                  }}>
                    That's all friends. Marhabar
                  </div>
                  <div className="h2" style={{ fontSize: '2rem' }}>{session.title}</div>
                  <div className="pill" style={{ fontSize: '1.5rem', padding: '16px 32px', marginTop: 24 }}>
                    Album Average: {albumAvg ? albumAvg.toFixed(2) : '—'}
                  </div>
                  <div className="pill" style={{ fontSize: '1.25rem', padding: '14px 28px', marginTop: 16 }}>
                    Jimothy please click end
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
                gap: 24
              }}
            >
              <div className="h1" style={{ color: 'var(--gold)' }}>
                Thanks for rating! Future me, did you like it as much as you hoped?? I'm very hyped right now and praying you're not dissapointed 
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
  )
}