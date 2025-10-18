'use client'

import { Card } from '@/components/ui/card'
import { Flame } from 'lucide-react'

interface ShareImageProps {
  type: 'verse' | 'prayer'
  content: {
    title: string
    text: string
    subtitle?: string
  }
  streak?: number
}

export function ShareImage({ type, content, streak }: ShareImageProps) {
  return (
    <div
      id="share-image"
      className="relative w-[1080px] h-[1920px] flex flex-col bg-gradient-to-br from-primary/20 via-background to-accent/20 p-16"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Header with Streak */}
      <div className="flex items-center justify-between mb-12">
        <div className="text-4xl font-bold text-primary">
          Biblia Católica AI
        </div>
        {streak !== undefined && streak > 0 && (
          <div className="flex items-center gap-4 bg-primary/10 px-8 py-4 rounded-full border-2 border-primary">
            <Flame className="h-12 w-12 text-orange-500" />
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{streak}</div>
              <div className="text-2xl text-muted-foreground">
                {streak === 1 ? 'día' : 'días'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <Card className="flex-1 flex flex-col justify-center p-16 bg-card/95 backdrop-blur">
        <div className="space-y-8">
          {/* Title */}
          <div className="space-y-4">
            <div className="text-3xl font-semibold text-primary uppercase tracking-wide">
              {type === 'verse' ? 'Versículo del Día' : 'Mi Oración'}
            </div>
            <div className="text-5xl font-bold text-foreground">
              {content.title}
            </div>
          </div>

          {/* Main Text */}
          <blockquote className="border-l-8 border-primary pl-8 py-4">
            <p className="text-3xl leading-relaxed italic text-foreground break-words">
              "{content.text}"
            </p>
          </blockquote>

          {/* Subtitle/Reflection */}
          {content.subtitle && (
            <p className="text-2xl text-muted-foreground leading-relaxed break-words">
              {content.subtitle}
            </p>
          )}
        </div>
      </Card>

      {/* Footer */}
      <div className="mt-12 text-center">
        <div className="text-2xl text-muted-foreground">
          Descubre más en
        </div>
        <div className="text-3xl font-bold text-primary mt-2">
          bibliacatolica.app
        </div>
      </div>
    </div>
  )
}
