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
  const TICK_DURATION = 500

  // Container ref to measure available height
  const containerRef = useRef<HTMLDivElement>(null)
  const [barMaxHeight, setBarMaxHeight] = useState(250)

  // Measure container and set bar height dynamically
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const availableHeight = containerRef.current.clientHeight
        // Leave room for avatar (70px) + name (25px) + score number floating above (50px) + margins
        const barHeight = Math.max(120, Math.min(350, availableHeight - 180))
        setBarMaxHeight(barHeight)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Stable order (not score-based)
  const orderedParticipants = useMemo(() => {
    return [...participants].sort((a, b) =>
      String(a.participant_id).localeCompare(String(b.participant_id))
    )
  }, [participants])

  const [currentScores, setCurrentScores] = useState<Record<string, number>>({})
  const hasStartedRef = useRef(false)

  // Store callbacks in refs so parent re-renders don't kill the interval
  const onTickRef = useRef<ScoreRevealProps['onTick']>(onTick)
  const onCompleteRef = useRef<ScoreRevealProps['onComplete']>(onComplete)

  useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Build a stable signature so we can reset on new song/scoreMap
  const scoreSig = useMemo(() => {
    return orderedParticipants
      .map(p => `${p.participant_id}:${scoreMap[p.participant_id] ?? 0}`)
      .join('|')
  }, [orderedParticipants, scoreMap])

  const highestScore = useMemo(() => {
    const vals = orderedParticipants.map(p => scoreMap[p.participant_id] ?? 0)
    return Math.max(0, ...vals)
  }, [orderedParticipants, scoreMap])

  // Reset when score set changes
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
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 40,
        padding: '0 32px',
        paddingBottom: 16
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
              flex: '0 0 auto',
              width: 180,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* Score number - positioned above the bar container */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
                color: 'white',
                textShadow: `0 0 20px ${color}`,
                marginBottom: 8,
                height: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {Math.round(displayScore)}
            </motion.div>

            {/* Bar container - fixed height, bar grows from bottom */}
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
                position: 'relative'
              }}
            >
              {/* The rising bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: barHeight }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  width: '70%',
                  background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
                  borderRadius: 'var(--radius-md)',
                  boxShadow: `0 0 30px ${color}44`
                }}
              />
            </div>

            {/* Avatar and name below bar */}
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
  )
}