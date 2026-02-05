import { useCallback, useRef, useEffect } from 'react'
import { Howl } from 'howler'

/**
 * IMPORTANT:
 * - Keep your assets in /public/audio/...
 * - We generate URLs via import.meta.env.BASE_URL so it works on:
 *   - localhost
 *   - GitHub Pages subpaths (e.g. /album-night/)
 *   - base: './'
 */

const base = import.meta.env.BASE_URL || './'
const assetUrl = (path: string) => `${base}${path.replace(/^\//, '')}`

// Audio file paths - place your audio files in /public/audio/
const AUDIO_PATHS = {
  // Score reveal sounds (1-10)
  score_1: 'audio/scores/score_1.mp3',
  score_2: 'audio/scores/score_2.mp3',
  score_3: 'audio/scores/score_3.mp3',
  score_4: 'audio/scores/score_4.mp3',
  score_5: 'audio/scores/score_5.mp3',
  score_6: 'audio/scores/score_6.mp3',
  score_7: 'audio/scores/score_7.mp3',
  score_8: 'audio/scores/score_8.mp3',
  score_9: 'audio/scores/score_9.mp3',
  score_10: 'audio/scores/score_10.mp3',

  // Award reveal sounds
  award_stan: 'audio/awards/stan.mp3',
  award_hater: 'audio/awards/hater.mp3',
  award_highest: 'audio/awards/highest_rated.mp3',
  award_lowest: 'audio/awards/lowest_rated.mp3',
  award_divisive: 'audio/awards/most_divisive.mp3',

  // UI sounds
  submit: 'audio/ui/submit.mp3',
  lock: 'audio/ui/lock.mp3',
  reveal_start: 'audio/ui/reveal_start.mp3',
  bar_rise: 'audio/ui/bar_rise.mp3',
  bar_stop: 'audio/ui/bar_stop.mp3',
  average_flip: 'audio/ui/average_flip.mp3',
  confetti: 'audio/ui/confetti.mp3',
  drumroll: 'audio/ui/drumroll.mp3',
  fanfare: 'audio/ui/fanfare.mp3',
} as const

type AudioKey = keyof typeof AUDIO_PATHS

export function useAudio() {
  const soundsRef = useRef<Map<AudioKey, Howl>>(new Map())
  const loadedRef = useRef<Set<AudioKey>>(new Set())
  const missingRef = useRef<Set<AudioKey>>(new Set()) // keys that failed to load
  const unlockedRef = useRef(false)

  // Call this once on any user interaction to satisfy autoplay policies
  const unlock = useCallback(() => {
    unlockedRef.current = true
  }, [])

  const createHowl = useCallback((key: AudioKey, volume = 0.7) => {
    const url = assetUrl(AUDIO_PATHS[key])

    const sound = new Howl({
      src: [url],
      preload: true,
      volume,
      html5: true, // helps on some TV browsers
      onloaderror: (_id, err) => {
        missingRef.current.add(key)
        console.warn(`Failed to load audio: ${key}`, err, url)
      }
    })

    return sound
  }, [])

  // Preload a specific sound (optional: won't break if missing)
  const preload = useCallback((key: AudioKey) => {
    if (loadedRef.current.has(key) || missingRef.current.has(key)) return

    const sound = createHowl(key)
    soundsRef.current.set(key, sound)
    loadedRef.current.add(key)
  }, [createHowl])

  // Preload common sounds
  const preloadCommon = useCallback(() => {
    const common: AudioKey[] = [
      'submit', 'lock', 'reveal_start', 'bar_rise',
      'bar_stop', 'average_flip', 'confetti', 'drumroll', 'fanfare'
    ]
    common.forEach(preload)
  }, [preload])

  // Play a sound (optional: silently no-op if missing or blocked)
  const play = useCallback((key: AudioKey, volume = 0.7) => {
    if (!unlockedRef.current) {
      // autoplay blocked until user gesture; do nothing (no throw)
      return
    }
    if (missingRef.current.has(key)) return

    let sound = soundsRef.current.get(key)
    if (!sound) {
      sound = createHowl(key, volume)
      soundsRef.current.set(key, sound)
    }

    try {
      sound.volume(volume)
      sound.play()
    } catch (e) {
      // don't break UI if a TV browser freaks out
      console.warn(`Failed to play audio: ${key}`, e)
    }
  }, [createHowl])

  const playScoreReaction = useCallback((score: number) => {
    const clamped = Math.min(10, Math.max(1, Math.round(score)))
    const key = `score_${clamped}` as AudioKey
    play(key)
  }, [play])

  const playAwardReaction = useCallback((award: string) => {
    const key = `award_${award}` as AudioKey
    if ((AUDIO_PATHS as any)[key]) play(key)
  }, [play])

  const stopAll = useCallback(() => {
    soundsRef.current.forEach(sound => {
      try { sound.stop() } catch {}
    })
  }, [])

  useEffect(() => {
    return () => {
      soundsRef.current.forEach(sound => {
        try { sound.unload() } catch {}
      })
      soundsRef.current.clear()
    }
  }, [])

  return {
    unlock,
    play,
    preload,
    preloadCommon,
    playScoreReaction,
    playAwardReaction,
    stopAll
  }
}

export { AUDIO_PATHS }
