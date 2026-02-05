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

type RevealStage = 'idle' | 'countdown' | 'rising' | 'average' | 'final'

export default function Tv() {
  const { code = '' } = useParams()
  const { session, participants, songs, scores, loading } = useSessionData(code)
  const { celebrate, fireworks } = useConfetti()
  const { play, preloadCommon, playScoreReaction } = useAudio()

  const [revealStage, setRevealStage] = useState<RevealStage>('idle')
  const [awardRevealComplete, setAwardRevealComplete] = useState(false)
  const audio = useAudio() // implement this in hook

  const joinUrl = `${window.location.origin}${window.location.pathname}#/join/${code}`

  const currentSong = useMemo(() => getCurrentSong(songs, session?.song_index ?? 0), [songs, session?.song_index])

  const songScores = useMemo(() => {
    if (!session) return []
    return scores.filter(s => s.song_index === session.song_index)
  }, [scores, session])

  const scoreMap = useMemo(() => {
    const m: Partial<Record<ParticipantId, number>> = {}
    for (const r of songScores) m[r.participant_id] = r.score
    return m
  }, [songScores])

  const submittedCount = songScores.length
  const songAvg = computeSongAvg(songScores)
  const [averageFlipping, setAverageFlipping] = useState(false)
  const [liveAverage, setLiveAverage] = useState(0)
  const playedAudioRef = useRef(false)

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

    if (data.albumAvg > 0) {
      awardList.push({
        id: 'album_avg',
        title: 'Album Average',
        subtitle: 'The group verdict',
        icon: '📊',
        value: data.albumAvg
      })
    }

    if (data.highestRated) {
      awardList.push({
        id: 'highest',
        title: 'Best Song',
        subtitle: 'Highest rated track',
        icon: '🔥',
        value: `Avg: ${data.highestRated.avg.toFixed(2)}`,
        song: data.highestRated.song
      })
    }

    if (data.lowestRated) {
      awardList.push({
        id: 'lowest',
        title: 'Worst Song',
        subtitle: "Didn't hit different",
        icon: '❄️',
        value: `Avg: ${data.lowestRated.avg.toFixed(2)}`,
        song: data.lowestRated.song
      })
    }

    if (data.mostDivisive) {
      awardList.push({
        id: 'divisive',
        title: 'Most Divisive',
        subtitle: 'Biggest spread in scores',
        icon: '⚡',
        value: `Spread: ${data.mostDivisive.spread}`,
        song: data.mostDivisive.song
      })
    }

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

  // Preload audio on mount
  useEffect(() => {
    preloadCommon()
  }, [preloadCommon])

  // Handle reveal animation stages
  useEffect(() => {
    if (!session) return

    if (session.status === 'revealing') {
  setRevealStage('countdown')
  setAverageFlipping(false)
  setLiveAverage(0)
  playedAudioRef.current = false

  const t1 = setTimeout(() => {
    setRevealStage('rising')
    setAverageFlipping(true)
  }, 800)

  return () => clearTimeout(t1)
}
  }, [session?.status, session?.song_index, play])

  useEffect(() => {
  const handler = () => audio
  window.addEventListener('keydown', handler, { once: true })
  window.addEventListener('pointerdown', handler, { once: true })
  return () => {
    window.removeEventListener('keydown', handler)
    window.removeEventListener('pointerdown', handler)
  }
}, [audio])

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

  const allJoined = participants.filter(p => p.claimed).length === 4

  return (
    <div className="tv-layout">
      {/* Header */}
      <div className="tv-header">
        <div>
          <div className="h2" style={{ color: 'var(--gold)', marginBottom: 0 }}>{session.title}</div>
          <div className="font-mono" style={{ opacity: 0.6 }}>{code}</div>
        </div>
        <div className="flex gap-sm">
          <Link to={`/admin/${code}`} className="btn btn-ghost btn-sm">Admin</Link>
          <Link to={`/results/${code}`} className="btn btn-ghost btn-sm">Results</Link>
        </div>
      </div>

      {/* Main content */}
      <div className="tv-content">
        <AnimatePresence mode="wait">
          {/* LOBBY STATE */}
          {session.status === 'lobby' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="row" style={{ maxWidth: 1000, margin: '0 auto' }}>
                {/* QR Code */}
                <div className="col">
                  <div className="card card-glow" style={{ padding: 32 }}>
                    <div className="h2" style={{ marginBottom: 20 }}>Scan to Join</div>
                    <div className="qr-container">
                      <QRCodeCanvas
                        value={joinUrl}
                        size={200}
                        fgColor="#D4AF37"
                        bgColor="#0a0f0a"
                        level="M"
                      />
                    </div>
                    <div className="spacer" />
                    <div className="font-mono" style={{ opacity: 0.7, fontSize: '0.875rem', wordBreak: 'break-all' }}>
                      {joinUrl}
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div className="col">
                  <div className="card" style={{ padding: 32 }}>
                    <div className="h2" style={{ marginBottom: 20 }}>
                      Waiting for guests... ({participants.filter(p => p.claimed).length}/4)
                    </div>
                    <div className="grid-2" style={{ gap: 16 }}>
                      {participants.map((p, idx) => (
                        <motion.div
                          key={p.participant_id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="card-inner"
                          style={{ opacity: p.claimed ? 1 : 0.4 }}
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
                              <div className={`pill ${p.claimed ? 'pill-success' : ''}`}>
                                {p.claimed ? '✓ Joined' : 'Waiting...'}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {allJoined && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                        style={{ marginTop: 24 }}
                      >
                        <div className="pill pill-success" style={{ fontSize: '1rem', padding: '12px 24px' }}>
                          ✓ All joined! Admin can start the album
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* IN-SONG STATE */}
          {session.status === 'in_song' && (
            <motion.div
              key={`song-${session.song_index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="text-center"
            >
              <div className="pill" style={{ marginBottom: 24 }}>
              Track {(session.song_index ?? 0) + 1} of {songs.length}
              </div>

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="h1"
                style={{ marginBottom: 48, maxWidth: 800, margin: '0 auto 48px' }}
              >
                {currentSong?.title ?? 'Loading...'}
              </motion.div>

              {/* Participant submission status */}
              <div className="grid-4" style={{ maxWidth: 800, margin: '0 auto' }}>
                {participants.map((p, idx) => {
                  const hasSubmitted = songScores.some(s => s.participant_id === p.participant_id)
                  return (
                    <motion.div
                      key={p.participant_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className="card text-center"
                      style={{ padding: 20 }}
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
                {submittedCount}/4 submitted
                {submittedCount === 4 && ' — Admin can lock in!'}
              </div>
            </motion.div>
          )}

          {/* REVEALING STATE */}
          {session.status === 'revealing' && (
            <motion.div
              key="revealing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="pill" style={{ marginBottom: 16 }}>
              Track {(session.song_index ?? 0) + 1}
              </div>

              <div className="h1" style={{ marginBottom: 32 }}>
                {currentSong?.title}
              </div>

              {revealStage === 'countdown' && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="h2"
                  style={{ color: 'var(--gold)' }}
                >
                  Scores locked in...
                </motion.div>
              )}

          {(revealStage === 'rising' || revealStage === 'final') && (
            <>
              <ScoreReveal
                key={`reveal-${session.song_index}`} // safety reset
                participants={participants}
                scoreMap={scoreMap}
                startReveal={revealStage === 'rising'}
                onTick={handleTick}
                onComplete={handleRevealComplete}
              />

              <div className="spacer-xl" />

              <AverageFlip
                value={averageFlipping ? liveAverage : songAvg}
                isFlipping={averageFlipping}
              />
            </>
          )}

              {revealStage === 'final' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{ marginTop: 32 }}
                >
                  <div className="pill" style={{ fontSize: '1rem', padding: '12px 24px' }}>
                    Admin: Press "Next Song" to continue
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* RESULTS STATE */}
          {session.status === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="h1" style={{ color: 'var(--gold)', marginBottom: 24 }}>
                All Songs Complete!
              </div>
              <div className="h2" style={{ marginBottom: 32 }}>
                Ready for the final results?
              </div>
              <div className="pill" style={{ fontSize: '1rem', padding: '12px 24px' }}>
                Admin: Press "Show Awards" to reveal
              </div>
            </motion.div>
          )}

          {/* FINAL REVEAL STATE */}
          {session.status === 'final_reveal' && (
            <motion.div
              key="final_reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {!awardRevealComplete ? (
                <AwardReveal
                  awards={awards}
                  onComplete={handleAwardsComplete}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="h1" style={{ color: 'var(--gold)', marginBottom: 24 }}>
                    🎉 That's a wrap!
                  </div>
                  <div className="h2" style={{ marginBottom: 32 }}>
                    {session.title}
                  </div>
                  <div className="pill" style={{ fontSize: '1rem', padding: '12px 24px' }}>
                    Admin: Press "Complete Session" to finish
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* COMPLETE STATE */}
          {session.status === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="h1" style={{ color: 'var(--gold)', marginBottom: 24 }}>
                Thanks for listening!
              </div>
              <div className="h2" style={{ marginBottom: 32 }}>
                {session.title}
              </div>
              <div className="spacer-xl" />
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
