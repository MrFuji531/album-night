import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Avatar from './Avatar'
import type { Participant, ParticipantId } from '../types'
import { getParticipantColor } from '../utils'

interface ScoreRevealProps {
  participants: Participant[]
  scoreMap: Partial<Record<ParticipantId, number>>
  startReveal: boolean
  onTick?: (currentScores: Record<string, number>) => void
  onComplete?: () => void
}

export default function ScoreReveal({
  participants,
  scoreMap,
  startReveal,
  onTick,
  onComplete
}: ScoreRevealProps) {
  const maxScore = 10
  const barMaxHeight = 320
  const TICK_DURATION = 500

  // ✅ stable order (not score-based)
  const orderedParticipants = useMemo(() => {
    return [...participants].sort((a, b) =>
      String(a.participant_id).localeCompare(String(b.participant_id))
    )
  }, [participants])

  const [currentScores, setCurrentScores] = useState<Record<string, number>>({})
  const hasStartedRef = useRef(false)

  // ✅ store callbacks in refs so parent re-renders don't kill the interval
  const onTickRef = useRef<ScoreRevealProps['onTick']>(onTick)
  const onCompleteRef = useRef<ScoreRevealProps['onComplete']>(onComplete)

  useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // build a stable signature so we can reset on new song/scoreMap
  const scoreSig = useMemo(() => {
    return orderedParticipants
      .map(p => `${p.participant_id}:${scoreMap[p.participant_id] ?? 0}`)
      .join('|')
  }, [orderedParticipants, scoreMap])

  const highestScore = useMemo(() => {
    const vals = orderedParticipants.map(p => scoreMap[p.participant_id] ?? 0)
    return Math.max(0, ...vals)
  }, [orderedParticipants, scoreMap])

  // ✅ reset when score set changes
  useEffect(() => {
    hasStartedRef.current = false
    const initial: Record<string, number> = {}
    orderedParticipants.forEach(p => (initial[p.participant_id] = 0))
    setCurrentScores(initial)
    onTickRef.current?.(initial)
  }, [scoreSig, orderedParticipants])

  useEffect(() => {
    if (!startReveal) return
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    let tick = 0

    const interval = setInterval(() => {
      tick++

      const next: Record<string, number> = {}
      for (const p of orderedParticipants) {
        const target = scoreMap[p.participant_id] ?? 0
        next[p.participant_id] = Math.min(tick, target)
      }

      setCurrentScores(next)
      onTickRef.current?.(next)

      if (tick >= highestScore) {
        clearInterval(interval)

        const final: Record<string, number> = {}
        for (const p of orderedParticipants) {
          final[p.participant_id] = scoreMap[p.participant_id] ?? 0
        }

        setCurrentScores(final)
        onTickRef.current?.(final)
        onCompleteRef.current?.()
      }
    }, TICK_DURATION)

    return () => clearInterval(interval)
  }, [startReveal, orderedParticipants, scoreMap, highestScore])

  return (
    <div className="w-full" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          gap: 24,
          justifyContent: 'center',
          alignItems: 'flex-end',
          height: barMaxHeight + 140,
          padding: '0 20px'
        }}
      >
        {orderedParticipants.map((p) => {
          const displayScore = currentScores[p.participant_id] ?? 0
          const targetScore = scoreMap[p.participant_id] ?? 0
          const isLocked = targetScore > 0 && displayScore >= targetScore

          const barHeight = (displayScore / maxScore) * barMaxHeight
          const color = getParticipantColor(p.participant_id)

          return (
            <div
              key={p.participant_id}
              style={{
                flex: 1,
                maxWidth: 180,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: barMaxHeight,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  padding: 8,
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: barHeight }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{
                    width: '80%',
                    background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
                    borderRadius: 'var(--radius-md)',
                    boxShadow: `0 0 30px ${color}44`
                  }}
                />

                {/* score always visible */}
                <div
                  style={{
                    position: 'absolute',
                    top: Math.max(barMaxHeight - barHeight - 45, 6),
                    fontFamily: 'var(--font-display)',
                    fontSize: '2.5rem',
                    color: 'white',
                    textShadow: `0 0 20px ${color}`,
                    transition: 'top 0.25s ease-out'
                  }}
                >
                  {Math.round(displayScore)}
                </div>

                {isLocked && (
                  <div
                    className="pill pill-success"
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      fontSize: '0.9rem',
                      padding: '6px 10px'
                    }}
                  >
                    ✓ Locked
                  </div>
                )}
              </div>

              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Avatar
                  participantId={p.participant_id}
                  name={p.name}
                  avatarUrl={p.avatar_url}
                  size="md"
                  glow={isLocked}
                />
                <div style={{ marginTop: 8, fontWeight: 700, fontSize: '1rem' }}>
                  {p.name}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}