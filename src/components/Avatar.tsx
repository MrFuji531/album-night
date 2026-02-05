import { useState } from 'react'
import type { ParticipantId } from '../types'
import { getParticipantColor } from '../utils'

interface AvatarProps {
  participantId: ParticipantId
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  glow?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'avatar',
  md: 'avatar',
  lg: 'avatar-lg',
  xl: 'avatar-xl'
}

const sizePx = {
  sm: 48,
  md: 64,
  lg: 96,
  xl: 120
}

export default function Avatar({ 
  participantId, 
  name, 
  avatarUrl, 
  size = 'md', 
  glow = false,
  className = '' 
}: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const color = getParticipantColor(participantId)

  const src = avatarUrl && !imgError 
    ? avatarUrl 
    : `/avatars/${name}.png`

  const handleError = () => {
    setImgError(true)
  }

  // If no image works, show initials
  if (imgError && !avatarUrl) {
    const initials = name.charAt(0).toUpperCase()
    const px = sizePx[size]

    return (
      <div
        className={`${sizeClasses[size]} ${glow ? 'avatar-glow' : ''} ${className}`}
        style={{
          width: px,
          height: px,
          background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: px * 0.5,
          color: 'var(--bg-deep)',
          borderRadius: '50%',
          border: '3px solid var(--border-accent)'
        }}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      onError={handleError}
      className={`${sizeClasses[size]} ${glow ? 'avatar-glow' : ''} ${className}`}
      style={{ borderColor: color }}
    />
  )
}
