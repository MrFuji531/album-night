import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'
import type { Participant, Session, Song, ScoreRow } from '../types'

export function useSessionData(code: string) {
  const [session, setSession] = useState<Session | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [scores, setScores] = useState<ScoreRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const refreshAll = useCallback(async () => {
    if (!code) return

    try {
      const [sessionRes, participantsRes, songsRes, scoresRes] = await Promise.all([
        supabase.from('sessions').select('*').eq('code', code).maybeSingle(),
        supabase.from('participants').select('*').eq('session_code', code),
        supabase.from('songs').select('*').eq('session_code', code).order('order_index'),
        supabase.from('scores').select('*').eq('session_code', code)
      ])

      if (sessionRes.error) throw sessionRes.error
      if (participantsRes.error) throw participantsRes.error
      if (songsRes.error) throw songsRes.error
      if (scoresRes.error) throw scoresRes.error

      setSession(sessionRes.data as Session | null)
      setParticipants((participantsRes.data ?? []) as Participant[])
      setSongs((songsRes.data ?? []) as Song[])
      setScores((scoresRes.data ?? []) as ScoreRow[])
      setError(null)
    } catch (err: unknown) {
      console.error('Error refreshing data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => {
    if (!code) {
      setLoading(false)
      return
    }

    refreshAll()

    // Set up real-time subscriptions
    const channelName = `session-${code}-${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions', filter: `code=eq.${code}` },
        (payload) => {
          console.log('Session change:', payload)
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setSession(payload.new as Session)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `session_code=eq.${code}` },
        () => {
          refreshAll()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'songs', filter: `session_code=eq.${code}` },
        () => {
          refreshAll()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores', filter: `session_code=eq.${code}` },
        () => {
          refreshAll()
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [code, refreshAll])

  const sortedSongs = useMemo(() => {
    return [...songs].sort((a, b) => a.order_index - b.order_index)
  }, [songs])

  return {
    session,
    participants,
    songs: sortedSongs,
    scores,
    loading,
    error,
    refreshAll
  }
}