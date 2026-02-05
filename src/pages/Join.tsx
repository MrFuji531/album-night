import { useMemo, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../supabaseClient'
import { useSessionData } from '../hooks/useSessionData'
import Avatar from '../components/Avatar'
import type { Participant, ParticipantId } from '../types'

export default function Join() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const { session, participants, loading } = useSessionData(code)
  const [checkingExisting, setCheckingExisting] = useState(true)

  // Check if user already has a claimed participant in localStorage
  useEffect(() => {
    if (loading || !session) return

    const existingId = localStorage.getItem(`albumnight:${code}:participant`) as ParticipantId | null
    
    if (existingId) {
      // Check if this participant is still claimed in the database
      const participant = participants.find(p => p.participant_id === existingId)
      
      if (participant?.claimed) {
        // They're already in - go straight to play
        navigate(`/play/${code}`, { replace: true })
        return
      } else {
        // Their claim was reset (admin reset session), clear localStorage
        localStorage.removeItem(`albumnight:${code}:participant`)
      }
    }
    
    setCheckingExisting(false)
  }, [loading, session, participants, code, navigate])

  const sorted = useMemo(() => {
    return [...participants].sort((a, b) => a.name.localeCompare(b.name))
  }, [participants])

  async function claim(p: Participant) {
    if (!session) return

    // If already claimed, allow "rejoin" - just set localStorage and go
    if (p.claimed) {
      const confirmRejoin = window.confirm(`${p.name} is already taken. Are you ${p.name} trying to rejoin?`)
      if (confirmRejoin) {
        localStorage.setItem(`albumnight:${code}:participant`, p.participant_id)
        navigate(`/play/${code}`, { replace: true })
      }
      return
    }

    const confirmed = window.confirm(`Join as ${p.name}?`)
    if (!confirmed) return

    const { error } = await supabase
      .from('participants')
      .update({ claimed: true, claimed_at: new Date().toISOString() })
      .eq('session_code', code)
      .eq('participant_id', p.participant_id)

    if (error) {
      alert(error.message)
      return
    }

    localStorage.setItem(`albumnight:${code}:participant`, p.participant_id)
    navigate(`/play/${code}`, { replace: true })
  }

  if (loading || checkingExisting) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="card text-center">
          <div className="loading-pulse h2">Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="card text-center">
          <div className="h2">Session not found</div>
          <div className="spacer" />
          <a href="#/" className="btn btn-secondary">Go Home</a>
        </div>
      </div>
    )
  }

  const allClaimed = participants.every(p => p.claimed)

  return (
    <div className="container" style={{ maxWidth: 600, paddingTop: 48 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
        style={{ marginBottom: 32 }}
      >
        <div className="h1" style={{ color: 'var(--gold)' }}>Join Session</div>
        <div className="spacer" />
        <div className="pill font-mono">{code}</div>
      </motion.div>

      <div className="spacer-lg" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
        style={{ marginBottom: 24, opacity: 0.8 }}
      >
        {allClaimed 
          ? "All spots taken! Tap your name to rejoin if you got disconnected."
          : "Tap your name to join"
        }
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {sorted.map((p, index) => (
          <motion.div
            key={p.participant_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => claim(p)}
              className="card w-full"
              style={{
                opacity: p.claimed ? 0.7 : 1,
                cursor: 'pointer',
                textAlign: 'center',
                padding: 24,
                border: p.claimed ? '1px solid var(--forest)' : '1px solid var(--gold)',
                background: p.claimed ? 'rgba(46, 139, 87, 0.1)' : 'rgba(212, 175, 55, 0.05)'
              }}
            >
              <div className="flex flex-col items-center gap-md">
                <Avatar
                  participantId={p.participant_id}
                  name={p.name}
                  avatarUrl={p.avatar_url}
                  size="lg"
                  glow={!p.claimed}
                />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>
                    {p.name}
                  </div>
                  <div className={`pill ${p.claimed ? 'pill-success' : ''}`}>
                    {p.claimed ? '✓ Joined (tap to rejoin)' : 'Available'}
                  </div>
                </div>
              </div>
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
