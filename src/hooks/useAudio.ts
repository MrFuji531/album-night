import { useCallback, useRef, useEffect } from 'react'
import { Howl } from 'howler'

// Audio file paths - place your audio files in /public/audio/
const AUDIO_PATHS = {
  // Score reveal sounds (1-10)
  score_1: '/audio/scores/score_1.mp3',
  score_2: '/audio/scores/score_2.mp3',
  score_3: '/audio/scores/score_3.mp3',
  score_4: '/audio/scores/score_4.mp3',
  score_5: '/audio/scores/score_5.mp3',
  score_6: '/audio/scores/score_6.mp3',
  score_7: '/audio/scores/score_7.mp3',
  score_8: '/audio/scores/score_8.mp3',
  score_9: '/audio/scores/score_9.mp3',
  score_10: '/audio/scores/score_10.mp3',

  // Award reveal sounds
  award_stan: '/audio/awards/stan.mp3',
  award_hater: '/audio/awards/hater.mp3',
  award_highest: '/audio/awards/highest_rated.mp3',
  award_lowest: '/audio/awards/lowest_rated.mp3',
  award_divisive: '/audio/awards/most_divisive.mp3',

  // UI sounds
  submit: '/audio/ui/submit.mp3',
  lock: '/audio/ui/lock.mp3',
  reveal_start: '/audio/ui/reveal_start.mp3',
  bar_rise: '/audio/ui/bar_rise.mp3',
  bar_stop: '/audio/ui/bar_stop.mp3',
  average_flip: '/audio/ui/average_flip.mp3',
  confetti: '/audio/ui/confetti.mp3',
  drumroll: '/audio/ui/drumroll.mp3',
  fanfare: '/audio/ui/fanfare.mp3',
}

type AudioKey = keyof typeof AUDIO_PATHS

export function useAudio() {
  const soundsRef = useRef<Map<AudioKey, Howl>>(new Map())
  const loadedRef = useRef<Set<AudioKey>>(new Set())

  // Preload a specific sound
  const preload = useCallback((key: AudioKey) => {
    if (loadedRef.current.has(key)) return

    const sound = new Howl({
      src: [AUDIO_PATHS[key]],
      preload: true,
      volume: 0.7,
      onloaderror: () => {
        console.warn(`Failed to load audio: ${key}`)
      }
    })

    soundsRef.current.set(key, sound)
    loadedRef.current.add(key)
  }, [])

  // Preload common sounds
  const preloadCommon = useCallback(() => {
    const common: AudioKey[] = [
      'submit', 'lock', 'reveal_start', 'bar_rise',
      'bar_stop', 'average_flip', 'confetti', 'drumroll', 'fanfare'
    ]
    common.forEach(preload)
  }, [preload])

  // Play a sound
  const play = useCallback((key: AudioKey, volume = 0.7) => {
    let sound = soundsRef.current.get(key)

    if (!sound) {
      sound = new Howl({
        src: [AUDIO_PATHS[key]],
        volume,
        onloaderror: () => {
          console.warn(`Failed to load audio: ${key}`)
        }
      })
      soundsRef.current.set(key, sound)
    }

    sound.volume(volume)
    sound.play()
  }, [])

  // Play score-specific Cole reaction
  const playScoreReaction = useCallback((score: number) => {
    const clampedScore = Math.min(10, Math.max(1, Math.round(score)))
    const key = `score_${clampedScore}` as AudioKey
    play(key)
  }, [play])

  // Play award-specific Cole reaction
  const playAwardReaction = useCallback((award: string) => {
    const key = `award_${award}` as AudioKey
    if (AUDIO_PATHS[key]) {
      play(key)
    }
  }, [play])

  // Stop all sounds
  const stopAll = useCallback(() => {
    soundsRef.current.forEach(sound => {
      sound.stop()
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundsRef.current.forEach(sound => {
        sound.unload()
      })
      soundsRef.current.clear()
    }
  }, [])

  return {
    play,
    preload,
    preloadCommon,
    playScoreReaction,
    playAwardReaction,
    stopAll
  }
}

// Export audio paths for reference
export { AUDIO_PATHS }
