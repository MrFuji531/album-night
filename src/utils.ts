import type { ParticipantId, Song, ScoreRow, Participant } from './types'

export const PARTICIPANTS: { id: ParticipantId; name: string; color: string }[] = [
  { id: 'james', name: 'James', color: '#D4AF37' },  // Gold
  { id: 'lee', name: 'Lee', color: '#2E8B57' },      // Sea Green
  { id: 'ben', name: 'Ben', color: '#CD853F' },      // Peru/Brown
  { id: 'steph', name: 'Steph', color: '#8B4513' }   // Saddle Brown
]

export function getParticipantColor(id: ParticipantId): string {
  return PARTICIPANTS.find(p => p.id === id)?.color ?? '#D4AF37'
}

export function clampScore(n: number): number {
  if (Number.isNaN(n)) return 1
  return Math.min(10, Math.max(1, Math.round(n)))
}

export function getCurrentSong(songs: Song[], songIndex: number): Song | null {
  const sorted = [...songs].sort((a, b) => a.order_index - b.order_index)
  return sorted[songIndex] ?? null
}

export function computeSongAvg(scores: ScoreRow[]): number {
  if (!scores.length) return 0
  const sum = scores.reduce((acc, r) => acc + r.score, 0)
  return sum / scores.length
}

export function computeSpread(scores: ScoreRow[]): number {
  if (!scores.length) return 0
  let mn = Infinity
  let mx = -Infinity
  for (const r of scores) {
    mn = Math.min(mn, r.score)
    mx = Math.max(mx, r.score)
  }
  return mx - mn
}

export function mean(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export function getScoreReactionTier(score: number): 'low' | 'medium' | 'high' {
  if (score <= 4) return 'low'
  if (score <= 7) return 'medium'
  return 'high'
}

export function getScoreEmoji(score: number): string {
  if (score <= 2) return '😬'
  if (score <= 4) return '😐'
  if (score <= 6) return '🙂'
  if (score <= 8) return '🔥'
  return '🏆'
}

// Calculate awards based on all scores
export function calculateAwards(
  participants: Participant[],
  scores: ScoreRow[],
  songs: Song[]
): {
  stan: { participant: Participant; avg: number } | null
  hater: { participant: Participant; avg: number } | null
  mostDivisive: { song: Song; spread: number } | null
  highestRated: { song: Song; avg: number } | null
  lowestRated: { song: Song; avg: number } | null
  albumAvg: number
  personAverages: Record<ParticipantId, number>
} {
  // Calculate person averages
  const personAverages: Record<string, { total: number; count: number }> = {}
  for (const p of participants) {
    personAverages[p.participant_id] = { total: 0, count: 0 }
  }
  for (const s of scores) {
    const pa = personAverages[s.participant_id]
    if (pa) {
      pa.total += s.score
      pa.count += 1
    }
  }

  const avgMap: Record<ParticipantId, number> = {} as Record<ParticipantId, number>
  for (const [id, data] of Object.entries(personAverages)) {
    avgMap[id as ParticipantId] = data.count > 0 ? data.total / data.count : 0
  }

  // Find stan (highest avg) and hater (lowest avg)
  let stan: { participant: Participant; avg: number } | null = null
  let hater: { participant: Participant; avg: number } | null = null

  for (const p of participants) {
    const avg = avgMap[p.participant_id]
    if (avg > 0) {
      if (!stan || avg > stan.avg) {
        stan = { participant: p, avg }
      }
      if (!hater || avg < hater.avg) {
        hater = { participant: p, avg }
      }
    }
  }

  // Calculate song stats
  const songStats = songs.map(song => {
    const songScores = scores.filter(s => s.song_index === song.order_index)
    const avg = computeSongAvg(songScores)
    const spread = computeSpread(songScores)
    return { song, avg, spread, count: songScores.length }
  }).filter(s => s.count === 4)

  const mostDivisive = songStats.length > 0
    ? [...songStats].sort((a, b) => b.spread - a.spread)[0]
    : null

  const highestRated = songStats.length > 0
    ? [...songStats].sort((a, b) => b.avg - a.avg)[0]
    : null

  const lowestRated = songStats.length > 0
    ? [...songStats].sort((a, b) => a.avg - b.avg)[0]
    : null

  // Album average
  const allAvgs = Object.values(avgMap).filter(a => a > 0)
  const albumAvg = mean(allAvgs)

  return {
    stan,
    hater,
    mostDivisive: mostDivisive ? { song: mostDivisive.song, spread: mostDivisive.spread } : null,
    highestRated: highestRated ? { song: highestRated.song, avg: highestRated.avg } : null,
    lowestRated: lowestRated ? { song: lowestRated.song, avg: lowestRated.avg } : null,
    albumAvg,
    personAverages: avgMap
  }
}

// Generate random session code
export function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// Format time duration
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
