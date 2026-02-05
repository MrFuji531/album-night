import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface AverageFlipProps {
  value: number
  isFlipping: boolean
}

export default function AverageFlip({ value, isFlipping }: AverageFlipProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isFlipping) {
      setDisplayValue(value)
      return
    }

    const animate = () => {
      // jitter around the incoming value for chaos
      const jitter = (Math.random() - 0.5) * 1.2
      const next = Math.max(0, Math.min(10, value + jitter))
      setDisplayValue(next)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isFlipping, value])

  const getReaction = (score: number) => {
    if (score >= 8) return '🔥 BANGER'
    if (score >= 6) return '✨ SOLID'
    if (score >= 4) return '😐 SHMEE SHMA'
    return '❄️ TEEEEERRIBLE'
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8
      }}
    >
      <div style={{ fontSize: '1rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Song Average
      </div>

      <motion.div
        animate={isFlipping ? { scale: [1, 1.02, 0.98, 1] } : {}}
        transition={{ duration: 0.15, repeat: isFlipping ? Infinity : 0 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(4rem, 10vw, 6rem)',
          lineHeight: 1,
          color: 'var(--gold)',
          textShadow: '0 0 40px rgba(212, 175, 55, 0.5)',
          fontVariantNumeric: 'tabular-nums',
          minWidth: '4ch',
          textAlign: 'center'
        }}
      >
        {displayValue.toFixed(2)}
      </motion.div>

      {!isFlipping && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="pill"
          style={{ fontSize: '1rem', padding: '8px 16px' }}
        >
          {getReaction(value)}
        </motion.div>
      )}
    </motion.div>
  )
}