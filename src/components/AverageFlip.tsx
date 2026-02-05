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

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="text-center"
    >
      <div className="text-muted" style={{ marginBottom: 8, fontSize: '1.25rem' }}>
        SONG AVERAGE
      </div>

      <motion.div
        animate={isFlipping ? { scale: [1, 1.02, 0.98, 1] } : {}}
        transition={{ duration: 0.15, repeat: isFlipping ? Infinity : 0 }}
        className="score-display"
        style={{ fontVariantNumeric: 'tabular-nums', minWidth: '3ch', display: 'inline-block' }}
      >
        {displayValue.toFixed(2)}
      </motion.div>

      {!isFlipping && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="pill"
          style={{ marginTop: 16 }}
        >
          {value >= 8 ? '🔥 HEAT' : value >= 6 ? '✨ SOLID' : value >= 4 ? '😐 MEH' : '❄️ COLD'}
        </motion.div>
      )}
    </motion.div>
  )
}