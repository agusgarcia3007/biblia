'use client'

import { Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StreakBadgeProps {
  streak: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function StreakBadge({ streak, className, size = 'md' }: StreakBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  }

  return (
    <Badge
      variant={streak > 0 ? 'default' : 'secondary'}
      className={cn(
        'flex items-center gap-1.5 font-semibold',
        sizeClasses[size],
        streak > 0 && 'bg-orange-500 hover:bg-orange-600',
        className
      )}
    >
      <Flame
        size={iconSizes[size]}
        className={cn(streak > 0 && 'fill-orange-200')}
      />
      <span>{streak} días</span>
    </Badge>
  )
}
