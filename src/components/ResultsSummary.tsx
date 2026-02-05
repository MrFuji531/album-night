import { forwardRef } from 'react'
import type { Participant, Song, ScoreRow } from '../types'
import { calculateAwards, computeSongAvg, getParticipantColor } from '../utils'
import Avatar from './Avatar'

interface ResultsSummaryProps {
  sessionTitle: string
  participants: Participant[]
  songs: Song[]
  scores: ScoreRow[]
}

const ResultsSummary = forwardRef<HTMLDivElement, ResultsSummaryProps>(
  ({ sessionTitle, participants, songs, scores }, ref) => {
    const awards = calculateAwards(participants, scores, songs)

    // Calculate song rankings
    const songRankings = songs.map(song => {
      const songScores = scores.filter(s => s.song_index === song.order_index)
      return {
        song,
        avg: computeSongAvg(songScores)
      }
    }).sort((a, b) => b.avg - a.avg)

    return (
      <div
        ref={ref}
        style={{
          width: 600,
          padding: 40,
          background: 'linear-gradient(180deg, #0d1610 0%, #0a0f0a 100%)',
          borderRadius: 24,
          border: '2px solid var(--gold)',
          fontFamily: 'var(--font-body)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              color: 'var(--gold)',
              letterSpacing: '0.05em',
              marginBottom: 4
            }}
          >
            {sessionTitle}
          </div>

          <div
            style={{
              fontSize: 14,
              opacity: 0.85,
              marginBottom: 6,
              letterSpacing: '0.08em'
            }}
          >
            J. Cole
          </div>

          <div style={{ opacity: 0.7, fontSize: 14 }}>
            ALBUM NIGHT RESULTS
          </div>
        </div>

        {/* Album Average */}
        <div 
          style={{ 
            textAlign: 'center', 
            padding: 24, 
            background: 'rgba(212, 175, 55, 0.1)',
            borderRadius: 16,
            marginBottom: 24
          }}
        >
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>GROUP AVERAGE</div>
          <div style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: 64, 
            color: 'var(--gold)',
            lineHeight: 1
          }}>
            {awards.albumAvg.toFixed(2)}
          </div>
        </div>

        {/* Participants Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
          {participants.map(p => {
            const avg = awards.personAverages[p.participant_id]
            const isStan = awards.stan?.participant.participant_id === p.participant_id
            const isHater = awards.hater?.participant.participant_id === p.participant_id
            const color = getParticipantColor(p.participant_id)

            return (
              <div 
                key={p.participant_id}
                style={{ 
                  padding: 16, 
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  border: `1px solid ${isStan || isHater ? color : 'transparent'}`
                }}
              >
                <Avatar
                  participantId={p.participant_id}
                  name={p.name}
                  avatarUrl={p.avatar_url}
                  size="sm"
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.name}
                    {isStan && <span>🏆</span>}
                    {isHater && <span>🧊</span>}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.7 }}>
                    Avg: {avg.toFixed(2)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Top Songs */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12, textTransform: 'uppercase' }}>
            Song Rankings
          </div>
          {songRankings.slice(0, 5).map((item, idx) => (
            <div 
              key={item.song.id}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ 
                  fontWeight: 700, 
                  color: idx === 0 ? 'var(--gold)' : 'var(--text-muted)',
                  width: 20
                }}>
                  {idx + 1}
                </span>
                <span>{item.song.title}</span>
              </div>
              <span style={{ 
                fontFamily: 'var(--font-mono)', 
                color: 'var(--gold)',
                fontWeight: 600
              }}>
                {item.avg.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        {/* Special Awards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: 12 
        }}>
          {awards.mostDivisive && (
            <div style={{ 
              padding: 12, 
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>⚡</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Most Divisive</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{awards.mostDivisive.song.title}</div>
            </div>
          )}
          {awards.highestRated && (
            <div style={{ 
              padding: 12, 
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>🔥</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Highest Rated</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{awards.highestRated.song.title}</div>
            </div>
          )}
           {awards.lowestRated && (
            <div style={{ 
              padding: 12, 
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>⚡</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Lowest Rated</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{awards.lowestRated.song.title}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: 24, 
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: 12,
          opacity: 0.5
        }}>
          Album Night • {new Date().toLocaleDateString()}
        </div>
      </div>
    )
  }
)

ResultsSummary.displayName = 'ResultsSummary'

export default ResultsSummary
