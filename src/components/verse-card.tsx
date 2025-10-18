'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Share2, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerseCardProps {
  verse: {
    reference: string
    text: string
    is_deuterocanon?: boolean
  }
  reflection?: string
  onViewContext?: () => void
  onShare?: () => void
  onSave?: () => void
  className?: string
}

export function VerseCard({
  verse,
  reflection,
  onViewContext,
  onShare,
  onSave,
  className,
}: VerseCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">{verse.reference}</CardTitle>
          {verse.is_deuterocanon && (
            <span className="text-xs text-muted-foreground italic">Deuterocanónico</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <blockquote className="border-l-4 border-primary pl-4 italic text-foreground">
          "{verse.text}"
        </blockquote>

        {reflection && (
          <CardDescription className="text-sm leading-relaxed">{reflection}</CardDescription>
        )}

        <div className="flex flex-wrap gap-2">
          {onViewContext && (
            <Button variant="outline" size="sm" onClick={onViewContext}>
              <BookOpen className="mr-2 h-4 w-4" />
              Ver contexto
            </Button>
          )}
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartir
            </Button>
          )}
          {onSave && (
            <Button variant="outline" size="sm" onClick={onSave}>
              <Bookmark className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
