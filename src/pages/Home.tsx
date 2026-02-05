import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../supabaseClient'
import { randomCode } from '../utils'

export default function Home() {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createSession() {
    setCreating(true)
    setError(null)

    const code = randomCode()

    try {
      // Create session
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert([{ 
          code, 
          title: 'J. Cole Album Night', 
          status: 'lobby', 
          song_index: 0, 
          locked: false 
        }])

      if (sessionError) throw sessionError

      // Create 4 participants
      const participants = [
        { session_code: code, participant_id: 'james', name: 'James', avatar_url: null, claimed: false },
        { session_code: code, participant_id: 'lee', name: 'Lee', avatar_url: null, claimed: false },
        { session_code: code, participant_id: 'ben', name: 'Ben', avatar_url: null, claimed: false },
        { session_code: code, participant_id: 'steph', name: 'Steph', avatar_url: null, claimed: false }
      ]

      const { error: participantsError } = await supabase
        .from('participants')
        .insert(participants)

      if (participantsError) throw participantsError

      // Navigate to admin
      window.location.hash = `#/admin/${code}`
    } catch (err) {
      console.error('Error creating session:', err)
      setError(err instanceof Error ? err.message : 'Failed to create session')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="card card-glow text-center"
        style={{ maxWidth: 500, padding: 48 }}
      >
        {/* Logo/Title */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className="h1" style={{ color: 'var(--gold)', marginBottom: 8 }}>
            Album Night
          </div>
          <div className="h2" style={{ color: 'var(--text-secondary)' }}>
            J. Cole Listening Party
          </div>
        </motion.div>

        <div className="spacer-xl" />

        {/* Decorative element */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            width: 80,
            height: 4,
            background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
            margin: '0 auto 32px'
          }}
        />

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.5 }}
          style={{ marginBottom: 32, lineHeight: 1.7 }}
        >
          Rating tracks since 2026
        </motion.p>

        {/* Create button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary btn-lg w-full"
          onClick={createSession}
          disabled={creating}
        >
          {creating ? (
            <>
              <span className="loading-spin" style={{ display: 'inline-block' }}>⏳</span>
              Creating...
            </>
          ) : (
            'Create New Session'
          )}
        </motion.button>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pill pill-danger"
            style={{ marginTop: 16 }}
          >
            {error}
          </motion.div>
        )}

        <div className="spacer-lg" />

        {/* Guest list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.6 }}
          style={{ fontSize: '0.875rem' }}
        >
          <div style={{ marginBottom: 8 }}>Tonight's crew:</div>
          <div className="flex justify-center gap-sm" style={{ flexWrap: 'wrap' }}>
            {['James', 'Lee', 'Ben', 'Steph'].map(name => (
              <span key={name} className="pill">{name}</span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
