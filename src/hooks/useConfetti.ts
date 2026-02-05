import { useCallback } from 'react'
import confetti from 'canvas-confetti'

export function useConfetti() {
  // Small burst at specific position (for when a bar stops)
  const burstAt = useCallback((x: number, y: number, color?: string) => {
    const colors = color ? [color, '#D4AF37'] : ['#D4AF37', '#2E8B57', '#CD853F', '#8B4513']

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { x, y },
      colors,
      startVelocity: 20,
      gravity: 1.2,
      scalar: 0.8,
      ticks: 80
    })
  }, [])

  // Big celebration (for reveals, awards)
  const celebrate = useCallback(() => {
    const duration = 2000
    const end = Date.now() + duration

    const colors = ['#D4AF37', '#2E8B57', '#CD853F', '#F5F5DC', '#FFD700']

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors
      })

      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [])

  // Fireworks effect
  const fireworks = useCallback(() => {
    const duration = 3000
    const end = Date.now() + duration

    const colors = ['#D4AF37', '#2E8B57', '#CD853F', '#F5F5DC', '#FFD700', '#FFFFFF']

    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval)
        return
      }

      confetti({
        particleCount: 100,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: Math.random(),
          y: Math.random() - 0.2
        },
        colors,
        gravity: 0.8
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  // Gold shower (for special moments)
  const goldShower = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 180,
      origin: { x: 0.5, y: 0 },
      colors: ['#D4AF37', '#FFD700', '#FFC300', '#F5F5DC'],
      startVelocity: 45,
      gravity: 0.8,
      scalar: 1.2,
      ticks: 200
    })
  }, [])

  return {
    burstAt,
    celebrate,
    fireworks,
    goldShower
  }
}
