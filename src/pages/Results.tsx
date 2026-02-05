import { useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QRCodeCanvas } from 'qrcode.react'
import { toPng } from 'html-to-image'
import { useSessionData } from '../hooks/useSessionData'
import { calculateAwards, computeSongAvg, getParticipantColor } from '../utils'
import Avatar from '../components/Avatar'
import ResultsSummary from '../components/ResultsSummary'

export default function Results() {
  const { code = '' } = useParams()
  const { session, participants, songs, scores, loading } = useSessionData(code)
  const resultRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const shareUrl = `${window.location.origin}${window.location.pathname}#/results/${code}`

  const awards = useMemo(() => calculateAwards(participants, scores, songs), [participants, scores, songs])

  const songRankings = useMemo(() => {
    return songs.map(song => {
      const songScores = scores.filter(s => s.song_index === song.order_index)
      const scoresByPerson: Record<string, number> = {}
      for (const s of songScores) {
        scoresByPerson[s.participant_id] = s.score
      }
      return {
        song,
        avg: computeSongAvg(songScores),
        scores: scoresByPerson
      }
    }).sort((a, b) => b.avg - a.avg)
  }, [songs, scores])

  async function downloadResults() {
    if (!resultRef.current) return
    setDownloading(true)

    try {
      const dataUrl = await toPng(resultRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#0a0f0a'
      })

      const link = document.createElement('a')
      link.download = `album-night-${code}-${new Date().toISOString().split('T')[0]}.png`
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
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="card text-center">
          <div className="loading-pulse h2">Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="card text-center">
          <div className="h2">Session not found</div>
          <div className="spacer" />
          <a href="#/" className="btn btn-secondary">Go Home</a>
        </div>
      </div>
    )
  }

  return (
    <div className="container-wide" style={{ paddingTop: 32, paddingBottom: 64 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
        style={{ marginBottom: 48 }}
      >
        <div className="h1" style={{ color: 'var(--gold)' }}>{session.title}</div>
        <div className="h2">Final Results</div>

        <div className="spacer-lg" />

        <div className="flex justify-center gap-sm" style={{ flexWrap: 'wrap' }}>
          <Link to={`/admin/${code}`} className="btn btn-ghost btn-sm">Admin</Link>
          <Link to={`/tv/${code}`} className="btn btn-ghost btn-sm">TV View</Link>
        </div>
      </motion.div>

      <div className="row">
        {/* Left column */}
        <div className="col" style={{ maxWidth: 400 }}>
          {/* Album Average */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card card-gold text-center"
            style={{ padding: 32, marginBottom: 24 }}
          >
            <div style={{ opacity: 0.7, marginBottom: 8 }}>GROUP AVERAGE</div>
            <div className="score-display">
              {awards.albumAvg ? awards.albumAvg.toFixed(2) : '—'}
            </div>
          </motion.div>

          {/* Share QR */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card text-center"
            style={{ padding: 24, marginBottom: 24 }}
          >
            <div className="h3" style={{ marginBottom: 16 }}>Share Results</div>
            <div className="qr-container">
              <QRCodeCanvas
                value={shareUrl}
                size={140}
                fgColor="#D4AF37"
                bgColor="#0a0f0a"
              />
            </div>
            <div className="spacer" />
            <button
              className="btn btn-primary w-full"
              onClick={downloadResults}
              disabled={downloading}
            >
              {downloading ? 'Generating...' : '📥 Download Summary'}
            </button>
          </motion.div>

          {/* Special Awards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
            style={{ padding: 24 }}
          >
            <div className="h3" style={{ marginBottom: 16 }}>Awards</div>

            {awards.stan && (
              <div className="card-inner" style={{ marginBottom: 12 }}>
                <div className="flex items-center gap-md">
                  <span style={{ fontSize: '2rem' }}>🏆</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>THE STAN</div>
                    <div style={{ opacity: 0.7, fontSize: '0.875rem' }}>{awards.stan.participant.name}</div>
                  </div>
                  <div className="pill pill-success">{awards.stan.avg.toFixed(2)}</div>
                </div>
              </div>
            )}

            {awards.hater && (
              <div className="card-inner" style={{ marginBottom: 12 }}>
                <div className="flex items-center gap-md">
                  <span style={{ fontSize: '2rem' }}>🧊</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>THE HATER</div>
                    <div style={{ opacity: 0.7, fontSize: '0.875rem' }}>{awards.hater.participant.name}</div>
                  </div>
                  <div className="pill">{awards.hater.avg.toFixed(2)}</div>
                </div>
              </div>
            )}

            {awards.mostDivisive && (
              <div className="card-inner" style={{ marginBottom: 12 }}>
                <div className="flex items-center gap-md">
                  <span style={{ fontSize: '2rem' }}>⚡</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>MOST DIVISIVE</div>
                    <div style={{ opacity: 0.7, fontSize: '0.875rem' }}>{awards.mostDivisive.song.title}</div>
                  </div>
                  <div className="pill pill-warning">±{awards.mostDivisive.spread}</div>
                </div>
              </div>
            )}

            {awards.highestRated && (
              <div className="card-inner" style={{ marginBottom: 12 }}>
                <div className="flex items-center gap-md">
                  <span style={{ fontSize: '2rem' }}>🔥</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>BEST SONG</div>
                    <div style={{ opacity: 0.7, fontSize: '0.875rem' }}>{awards.highestRated.song.title}</div>
                  </div>
                  <div className="pill pill-success">{awards.highestRated.avg.toFixed(2)}</div>
                </div>
              </div>
            )}

            {awards.lowestRated && (
              <div className="card-inner">
                <div className="flex items-center gap-md">
                  <span style={{ fontSize: '2rem' }}>❄️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>WORST SONG</div>
                    <div style={{ opacity: 0.7, fontSize: '0.875rem' }}>{awards.lowestRated.song.title}</div>
                  </div>
                  <div className="pill pill-danger">{awards.lowestRated.avg.toFixed(2)}</div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right column */}
        <div className="col">
          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
            style={{ padding: 24, marginBottom: 24 }}
          >
            <div className="h3" style={{ marginBottom: 16 }}>Leaderboard</div>
            <div className="grid-4">
              {participants.map((p, idx) => {
                const avg = awards.personAverages[p.participant_id]
                const isStan = awards.stan?.participant.participant_id === p.participant_id
                const isHater = awards.hater?.participant.participant_id === p.participant_id
                const color = getParticipantColor(p.participant_id)

                return (
                  <motion.div
                    key={p.participant_id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="card-inner text-center"
                    style={{
                      border: isStan || isHater ? `2px solid ${color}` : undefined,
                      position: 'relative'
                    }}
                  >
                    {(isStan || isHater) && (
                      <div style={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '1.5rem'
                      }}>
                        {isStan ? '🏆' : '🧊'}
                      </div>
                    )}
                    <Avatar
                      participantId={p.participant_id}
                      name={p.name}
                      avatarUrl={p.avatar_url}
                      size="lg"
                      glow={isStan}
                    />
                    <div className="spacer" />
                    <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{p.name}</div>
                    <div className="spacer" />
                    <div className="score-small">{avg ? avg.toFixed(2) : '—'}</div>
                    <div style={{ opacity: 0.6, fontSize: '0.75rem', marginTop: 4 }}>average</div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Song Rankings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
            style={{ padding: 24 }}
          >
            <div className="h3" style={{ marginBottom: 16 }}>Song Rankings</div>
            <div className="flex flex-col gap-sm">
              {songRankings.map((item, idx) => (
                <motion.div
                  key={item.song.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="card-inner"
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                    <div className="flex items-center gap-md">
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.5rem',
                          color: idx === 0 ? 'var(--gold)' : idx === songRankings.length - 1 ? 'var(--danger)' : 'var(--text-muted)',
                          width: 32
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ fontWeight: 600 }}>{item.song.title}</span>
                    </div>
                    <div className={`pill ${idx === 0 ? 'pill-success' : idx === songRankings.length - 1 ? 'pill-danger' : ''}`}>
                      {item.avg ? item.avg.toFixed(2) : '—'}
                    </div>
                  </div>
                  <div className="flex gap-sm" style={{ marginLeft: 32 }}>
                    {participants.map(p => (
                      <span
                        key={p.participant_id}
                        className="pill"
                        style={{
                          fontSize: '0.7rem',
                          padding: '4px 8px',
                          background: `${getParticipantColor(p.participant_id)}22`
                        }}
                      >
                        {p.name.charAt(0)}: {item.scores[p.participant_id] ?? '—'}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Hidden element for image generation */}
      <div style={{ position: 'absolute', left: -9999, top: 0 }}>
        <ResultsSummary
          ref={resultRef}
          sessionTitle={session.title}
          participants={participants}
          songs={songs}
          scores={scores}
        />
      </div>
    </div>
  )
}
