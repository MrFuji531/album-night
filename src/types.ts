export type SessionStatus = 'lobby' | 'in_song' | 'revealing' | 'results' | 'final_reveal' | 'complete'

export type ParticipantId = 'james' | 'lee' | 'ben' | 'steph'

export type Participant = {
  session_code: string
  participant_id: ParticipantId
  name: string
  avatar_url: string | null
  claimed: boolean
  claimed_at: string | null
}

export type Session = {
  code: string
  title: string
  status: SessionStatus
  song_index?: number
  locked: boolean
  created_at: string
  reveal_stage?: string
}

export type Song = {
  id: string
  session_code: string
  order_index: number
  title: string
  created_at: string
}

export type ScoreRow = {
  id: string
  session_code: string
  song_index: number
  participant_id: ParticipantId
  score: number
  created_at: string
  submitted_at?: string | null
}

export type Award = {
  id: string
  title: string
  description: string
  icon: string
  winner?: ParticipantId
  value?: string | number
}
