import { useMemo, useState } from 'react'
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

const base = import.meta.env.BASE_URL || './'
const assetUrl = (path: string) => `${base}${path.replace(/^\//, '')}`

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

  // Prefer stored URL; otherwise try local avatar by participantId or name
  const fallbackCandidates = useMemo(() => {
    const safeName = encodeURIComponent(name.trim())
    const safeId = encodeURIComponent(String(participantId))
    return [
      assetUrl(`avatars/${safeId}.png`),
      assetUrl(`avatars/${safeName}.png`)
    ]
  }, [name, participantId])

  const src = useMemo(() => {
    if (avatarUrl && !imgError) return avatarUrl
    // if avatarUrl missing or errored, use first fallback
    return fallbackCandidates[0]
  }, [avatarUrl, imgError, fallbackCandidates])

  const handleError = () => {
    // if avatarUrl failed, flip to fallback; if fallback #1 failed, try fallback #2; then initials
    if (!imgError) {
      setImgError(true)
      return
    }
  }

  // initials fallback (always works)
  const initials = name.charAt(0).toUpperCase()
  const px = sizePx[size]

  return (
    <img
      src={src}
      alt={name}
      onError={(e) => {
        // if first fallback fails, try second fallback; if that fails, replace with initials block
        const el = e.currentTarget as HTMLImageElement
        if (el.dataset.fallback === '1') {
          el.src = fallbackCandidates[1]
          el.dataset.fallback = '2'
          return
        }
        if (!avatarUrl && el.dataset.fallback !== '1' && el.dataset.fallback !== '2') {
          // first failure on initial render => mark and try fallback #2 next
          el.dataset.fallback = '1'
          el.src = fallbackCandidates[1]
          return
        }

        // replace with initials block by hiding image and showing a sibling div
        el.style.display = 'none'
        const parent = el.parentElement
        if (parent && !parent.querySelector('[data-initials="1"]')) {
          const div = document.createElement('div')
          div.setAttribute('data-initials', '1')
          div.className = `${sizeClasses[size]} ${glow ? 'avatar-glow' : ''} ${className}`
          div.style.width = `${px}px`
          div.style.height = `${px}px`
          div.style.background = `linear-gradient(135deg, ${color} 0%, ${color}88 100%)`
          div.style.display = 'flex'
          div.style.alignItems = 'center'
          div.style.justifyContent = 'center'
          div.style.fontFamily = 'var(--font-display)'
          div.style.fontSize = `${px * 0.5}px`
          div.style.color = 'var(--bg-deep)'
          div.style.borderRadius = '50%'
          div.style.border = '3px solid var(--border-accent)'
          div.textContent = initials
          parent.appendChild(div)
        }

        handleError()
      }}
      className={`${sizeClasses[size]} ${glow ? 'avatar-glow' : ''} ${className}`}
      style={{ borderColor: color }}
    />
  )
}
