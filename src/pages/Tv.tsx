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
import type { ParticipantId } from '../types'

type RevealStage = 'idle' | 'countdown' | 'rising' | 'average' | 'final'

const DESIGN_W = 1920
const DESIGN_H = 1080

export default function Tv() {
  const { code = '' } = useParams()
  const { session, participants, songs, scores, loading } = useSessionData(code)
  const { celebrate, fireworks } = useConfetti()
  const { preloadCommon, playScoreReaction, unlock } = useAudio()

  const [revealStage, setRevealStage] = useState<RevealStage>('idle')
  const [awardRevealComplete, setAwardRevealComplete] = useState(false)

  const [scale, setScale] = useState(1)
  const stageRef = useRef<HTMLDivElement>(null)

  const playedAudioRef = useRef(false)
  const [averageFlipping, setAverageFlipping] = useState(false)
  const [liveAverage, setLiveAverage] = useState(0)

  /* ------------------ TV MODE ------------------ */
  useEffect(() => {
    document.body.classList.add('tv-mode')
    return () => document.body.classList.remove('tv-mode')
  }, [])

  useEffect(() => {
    const onResize = () => {
      const s = Math.min(
        window.innerWidth / DESIGN_W,
        window.innerHeight / DESIGN_H
      )
      setScale(s)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /* ------------------ DATA ------------------ */
  const currentSong = useMemo(
    () => getCurrentSong(songs, session?.song_index ?? 0),
    [songs, session?.song_index]
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

  const awards = useMemo(() => {
    const data = calculateAwards(participants, scores, songs)
    const list: Array<{
      id: string
      title: string
      subtitle: string
      icon: string
      value: string | number
      participantName?: string
    }> = []

    if (data.stan) {
      list.push({
        id: 'stan',
        title: 'THE STAN',
        subtitle: 'Highest average',
        icon: '🏆',
        value: data.stan.avg,
        participantName: data.stan.participant?.name
      })
    }

    if (data.hater) {
      list.push({
        id: 'hater',
        title: 'THE HATER',
        subtitle: 'Lowest average',
        icon: '🧊',
        value: data.hater.avg,
        participantName: data.hater.participant?.name
      })
    }

    return list
  }, [participants, scores, songs])

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

      const t = setTimeout(() => {
        setRevealStage('rising')
        setAverageFlipping(true)
      }, 800)

      return () => clearTimeout(t)
    }
  }, [session?.status, session?.song_index])

  const handleTick = (scoreObj: Record<string, number>) => {
    const vals = Object.values(scoreObj)
    const avg = vals.reduce((a, b) => a + b, 0) / (participants.length || 4)
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
    const normalized = base.startsWith('/') ? base : `/${base.replace(/^\.\//, '')}`
    return `${window.location.origin}${normalized}#/join/${code}`
  }, [code])

  /* ------------------ STATES ------------------ */
  if (loading) {
    return (
      <div className="tv-layout">
        <div className="tv-content">
          <div className="h1">Loading…</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="tv-layout">
        <div className="tv-content">
          <div className="h2">Session not found</div>
          <div className="spacer" />
          <a href="#/" className="btn btn-secondary">Go Home</a>
        </div>
      </div>
    )
  }

  const joinedCount = participants.filter(p => p.claimed).length
  const allJoined = joinedCount === 4

  /* ================== RENDER ================== */
  return (
    <div
      className="tv-layout"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-deep)'
      }}
    >
      <div
        ref={stageRef}
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          overflow: 'hidden'
        }}
      >
        {/* HEADER */}
        <div className="tv-header flex justify-between items-center">
          <div>
            <div className="h2" style={{ color: 'var(--gold)', marginBottom: 0 }}>{session.title}</div>
            <div className="font-mono opacity-50">{code}</div>
          </div>
          <div className="flex gap-sm">
            <Link to={`/admin/${code}`} className="btn btn-ghost btn-sm">Admin</Link>
            <Link to={`/results/${code}`} className="btn btn-ghost btn-sm">Results</Link>
          </div>
        </div>

        {/* CONTENT */}
        <div className="tv-content">
          <AnimatePresence mode="wait">

            {/* LOBBY */}
            {session.status === 'lobby' && (
              <motion.div
                key="lobby"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid-2 items-center"
                style={{ height: '100%' }}
              >
                <div className="card text-center">
                  <div className="h2" style={{ marginBottom: 12 }}>Scan to Join</div>
                  <div className="qr-container">
                    <QRCodeCanvas value={joinUrl} size={260} fgColor="#D4AF37" bgColor="#0a0f0a" level="M" />
                  </div>
                  <div className="spacer" />
                  <div className="font-mono opacity-75" style={{ wordBreak: 'break-all' }}>{joinUrl}</div>
                </div>

                <div className="card">
                  <div className="h2" style={{ marginBottom: 12 }}>Guests ({joinedCount}/4)</div>

                  <div className="grid-2" style={{ gap: 16 }}>
                    {participants.map((p, idx) => (
                      <motion.div
                        key={p.participant_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="card-inner flex items-center gap-md"
                        style={{ opacity: p.claimed ? 1 : 0.55 }}
                      >
                        <Avatar
                          participantId={p.participant_id}
                          name={p.name}
                          avatarUrl={p.avatar_url}
                          size="lg"
                          glow={p.claimed}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{p.name}</div>
                          <div className={`pill ${p.claimed ? 'pill-success' : 'pill-warning'}`}>
                            {p.claimed ? '✓ Joined' : 'Waiting…'}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {allJoined && (
                    <div className="spacer" />
                  )}

                  {allJoined && (
                    <div className="pill pill-success text-center" style={{ fontSize: '1rem', padding: '12px 24px' }}>
                      ✓ All joined! Admin can start the album
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* IN SONG */}
            {session.status === 'in_song' && (
              <motion.div
                key={`in_song-${session.song_index}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="pill" style={{ marginBottom: 16 }}>
                  Track {(session.song_index ?? 0) + 1} of {songs.length}
                </div>

                <div className="h1" style={{ marginBottom: 26 }}>
                  {currentSong?.title ?? 'Loading...'}
                </div>

                <div className="grid-4" style={{ gap: 16 }}>
                  {participants.map((p, idx) => {
                    const hasSubmitted = songScores.some(s => s.participant_id === p.participant_id)
                    return (
                      <motion.div
                        key={p.participant_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.06 }}
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
                      </motion.div>
                    )
                  })}
                </div>

                <div className="spacer-xl" />

                <div className="pill" style={{ fontSize: '1rem', padding: '12px 24px' }}>
                  {songScores.length}/4 submitted
                  {songScores.length === 4 && ' — Admin can lock in!'}
                </div>
              </motion.div>
            )}

            {/* REVEAL */}
            {session.status === 'revealing' && (
              <motion.div
                key="revealing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
                style={{ height: '100%' }}
              >
                <div className="pill" style={{ marginBottom: 10 }}>
                  Track {(session.song_index ?? 0) + 1} of {songs.length}
                </div>

                <div className="h1" style={{ marginBottom: 14 }}>
                  {currentSong?.title ?? ''}
                </div>

                {revealStage === 'countdown' && (
                  <div className="h2" style={{ color: 'var(--gold)' }}>
                    Scores locked in…
                  </div>
                )}

                {(revealStage === 'rising' || revealStage === 'final') && (
                  <>
                    <ScoreReveal
                      key={`reveal-${session.song_index ?? 0}`}
                      participants={participants}
                      scoreMap={scoreMap}
                      startReveal={revealStage === 'rising'}
                      onTick={handleTick}
                      onComplete={handleRevealComplete}
                    />

                    <div className="spacer" />

                    <AverageFlip
                      value={averageFlipping ? liveAverage : songAvg}
                      isFlipping={averageFlipping}
                    />
                  </>
                )}

                {revealStage === 'final' && (
                  <div className="spacer" />
                )}

                {revealStage === 'final' && (
                  <div className="pill" style={{ fontSize: '1rem', padding: '12px 24px' }}>
                    Admin: Press “Next Song” to continue
                  </div>
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
                className="text-center"
              >
                <div className="h1" style={{ color: 'var(--gold)' }}>All Songs Complete!</div>
                <div className="h2">Ready for awards?</div>
                <div className="spacer" />
                <div className="pill" style={{ fontSize: '1rem', padding: '12px 24px' }}>
                  Admin: Press “Show Awards”
                </div>
              </motion.div>
            )}

            {/* FINAL AWARDS */}
            {session.status === 'final_reveal' && (
              <motion.div
                key="final_reveal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ height: '100%' }}
              >
                {!awardRevealComplete ? (
                  <AwardReveal awards={awards} onComplete={handleAwardsComplete} />
                ) : (
                  <div className="text-center">
                    <div className="h1" style={{ color: 'var(--gold)' }}>🎉 That’s a wrap!</div>
                    <div className="h2">{session.title}</div>
                    <div className="spacer" />
                    <div className="pill" style={{ fontSize: '1rem', padding: '12px 24px' }}>
                      Admin: Press “Complete Session”
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
              >
                <div className="h1" style={{ color: 'var(--gold)' }}>Thanks for listening!</div>
                <div className="h2">{session.title}</div>
                <div className="spacer-xl" />
                <Link to={`/results/${code}`} className="btn btn-primary btn-lg">
                  View Full Results
                </Link>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
