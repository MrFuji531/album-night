import { useState, useEffect, useRef, useCallback } from 'react'
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
  const { play, preload, unlock } = useAudio()
  
  // Track if we've preloaded
  const preloadedRef = useRef(false)
  
  // Preload all award sounds on mount
  useEffect(() => {
    if (preloadedRef.current) return
    preloadedRef.current = true
    
    // Preload all the award sounds
    preload('drumroll')
    preload('award_stan')
    preload('award_hater')
    preload('award_highest')
    preload('award_lowest')
    preload('award_divisive')
    preload('fanfare')
  }, [preload])

  // Ensure audio is unlocked (user must have interacted with TV page already)
  useEffect(() => {
    unlock()
  }, [unlock])

  const playAwardSound = useCallback((awardId: string) => {
    // Map award IDs to their sound keys
    const soundMap: Record<string, string> = {
      'stan': 'award_stan',
      'hater': 'award_hater', 
      'highest': 'award_highest',
      'lowest': 'award_lowest',
      'divisive': 'award_divisive'
    }
    
    const soundKey = soundMap[awardId]
    if (soundKey) {
      play(soundKey as any)
    }
  }, [play])

  useEffect(() => {
    if (currentIndex >= awards.length) {
      // Play fanfare at the end
      play('fanfare')
      onComplete?.()
      return
    }

    if (currentIndex === -1) {
      // Start after a brief delay
      const timer = setTimeout(() => setCurrentIndex(0), 500)
      return () => clearTimeout(timer)
    }

    // Play drumroll when award title appears
    play('drumroll')
    
    const showTimer = setTimeout(() => {
      setShowValue(true)
      const award = awards[currentIndex]
      
      // Play the specific award sound
      playAwardSound(award.id)
      
      // Trigger confetti based on award type
      if (award.id === 'stan' || award.id === 'highest') {
        goldShower()
      } else {
        celebrate()
      }
    }, 2500)

    // Move to next award
    const nextTimer = setTimeout(() => {
      setShowValue(false)
      setCurrentIndex(prev => prev + 1)
    }, 10000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(nextTimer)
    }
  }, [currentIndex, awards, play, playAwardSound, celebrate, goldShower, onComplete])

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
            style={{ 
              width: '100%',
              maxWidth: 1400,
              padding: 48
            }}
          >
            {/* Award icon - HUGE */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              style={{ fontSize: '8rem', marginBottom: 24 }}
            >
              {currentAward.icon}
            </motion.div>

            {/* Award title - HUGE */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ 
                fontFamily: 'var(--font-display)',
                fontSize: '5rem',
                color: 'var(--gold)',
                marginBottom: 16,
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
            >
              {currentAward.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.5 }}
              style={{ fontSize: '1.5rem', marginBottom: 40 }}
            >
              {currentAward.subtitle}
            </motion.p>

            {/* Winner reveal - BIG */}
            <AnimatePresence>
              {showValue && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {currentAward.participant ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                      <Avatar
                        participantId={currentAward.participant.participant_id}
                        name={currentAward.participant.name}
                        avatarUrl={currentAward.participant.avatar_url}
                        size="xl"
                        glow
                      />
                      <div style={{ 
                        fontFamily: 'var(--font-display)',
                        fontSize: '4rem',
                        color: 'var(--text-primary)',
                        textTransform: 'uppercase'
                      }}>
                        {currentAward.participant.name}
                      </div>
                      <div className="pill pill-success" style={{ fontSize: '1.5rem', padding: '16px 32px' }}>
                        {typeof currentAward.value === 'number' 
                          ? `Average: ${currentAward.value.toFixed(2)}`
                          : currentAward.value
                        }
                      </div>
                    </div>
                  ) : currentAward.song ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                      <div style={{ 
                        fontFamily: 'var(--font-display)',
                        fontSize: '3.5rem',
                        color: 'var(--text-primary)',
                        textTransform: 'uppercase',
                        maxWidth: 1000
                      }}>
                        "{currentAward.song.title}"
                      </div>
                      <div className="pill" style={{ fontSize: '1.5rem', padding: '16px 32px' }}>
                        {typeof currentAward.value === 'number' 
                          ? currentAward.value.toFixed(2)
                          : currentAward.value
                        }
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '6rem',
                      color: 'var(--gold)',
                      textShadow: '0 0 40px rgba(212, 175, 55, 0.5)'
                    }}>
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
                marginTop: 60, 
                display: 'flex', 
                gap: 12, 
                justifyContent: 'center' 
              }}
            >
              {awards.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 16,
                    height: 16,
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