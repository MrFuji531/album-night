import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from './Avatar'
import { useConfetti } from '../hooks/useConfetti'
import { useAudio } from '../hooks/useAudio'
import type { Participant, Song } from '../types'

interface Award {
  id: string
  title: string
  subtitle: string
  icon: string
  value: string | number
  participant?: Participant
  song?: Song
}

interface AwardRevealProps {
  awards: Award[]
  onComplete?: () => void
}

export default function AwardReveal({ awards, onComplete }: AwardRevealProps) {
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [showValue, setShowValue] = useState(false)
  const { celebrate, goldShower } = useConfetti()
  const { play, playAwardReaction } = useAudio()

  useEffect(() => {
    if (currentIndex >= awards.length) {
      onComplete?.()
      return
    }

    if (currentIndex === -1) {
      // Start after a brief delay
      const timer = setTimeout(() => setCurrentIndex(0), 500)
      return () => clearTimeout(timer)
    }

    // Show the award title first
    play('drumroll')
    const showTimer = setTimeout(() => {
      setShowValue(true)
      const award = awards[currentIndex]
      
      if (award.id === 'stan') {
        goldShower()
        playAwardReaction('stan')
      } else if (award.id === 'hater') {
        celebrate()
        playAwardReaction('hater')
      } else {
        celebrate()
      }
    }, 2000)

    // Move to next award
    const nextTimer = setTimeout(() => {
      setShowValue(false)
      setCurrentIndex(prev => prev + 1)
    }, 5000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(nextTimer)
    }
  }, [currentIndex, awards, play, playAwardReaction, celebrate, goldShower, onComplete])

  const currentAward = currentIndex >= 0 && currentIndex < awards.length ? awards[currentIndex] : null

return (
  <div
    style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}
  >
      <AnimatePresence mode="wait">
        {currentAward && (
          <motion.div
            key={currentAward.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ duration: 0.5 }}
            className="text-center"
            style={{ maxWidth: 900, padding: 24 }}
          >
            {/* Award icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              style={{ fontSize: '5rem', marginBottom: 16 }}
            >
              {currentAward.icon}
            </motion.div>

            {/* Award title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="h1"
              style={{ color: 'var(--gold)', marginBottom: 8 }}
            >
              {currentAward.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.4 }}
              style={{ fontSize: '1.25rem', marginBottom: 24 }}
            >
              {currentAward.subtitle}
            </motion.p>

            {/* Winner reveal */}
            <AnimatePresence>
              {showValue && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {currentAward.participant ? (
                    <div className="flex flex-col items-center gap-md">
                      <Avatar
                        participantId={currentAward.participant.participant_id}
                        name={currentAward.participant.name}
                        avatarUrl={currentAward.participant.avatar_url}
                        size="xl"
                        glow
                      />
                      <div className="h2" style={{ color: 'var(--text-primary)' }}>
                        {currentAward.participant.name}
                      </div>
                      <div className="pill pill-success" style={{ fontSize: '1rem', padding: '10px 20px' }}>
                        {typeof currentAward.value === 'number' 
                          ? `Average: ${currentAward.value.toFixed(2)}`
                          : currentAward.value
                        }
                      </div>
                    </div>
                  ) : currentAward.song ? (
                    <div className="card card-gold text-center" style={{ padding: 32 }}>
                      <div className="h2" style={{ color: 'var(--text-primary)' }}>
                        "{currentAward.song.title}"
                      </div>
                      <div className="spacer" />
                      <div className="pill" style={{ fontSize: '1rem' }}>
                        {currentAward.value}
                      </div>
                    </div>
                  ) : (
                    <div className="score-display">
                      {typeof currentAward.value === 'number' 
                        ? currentAward.value.toFixed(2)
                        : currentAward.value
                      }
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress indicator */}
            <div 
              style={{ 
                marginTop: 40, 
                display: 'flex', 
                gap: 8, 
                justifyContent: 'center' 
              }}
            >
              {awards.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: idx <= currentIndex ? 'var(--gold)' : 'rgba(255,255,255,0.2)',
                    transition: 'background 0.3s ease'
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
