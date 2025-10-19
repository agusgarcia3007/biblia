'use client'

import { SAINT_PERSONAS, DEFAULT_PERSONA_KEY } from '@/lib/personas'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Check, Crown } from 'lucide-react'

interface SaintPickerProps {
  value: string
  onValueChange: (value: string) => void
  label?: string
  description?: string
  onPremiumRequired?: () => void
}

export function SaintPicker({
  value,
  onValueChange,
  label = 'Persona de santo',
  description,
  onPremiumRequired,
}: SaintPickerProps) {
  const handlePersonaClick = (personaKey: string) => {
    // Default persona is free, all others require premium
    if (personaKey !== DEFAULT_PERSONA_KEY && onPremiumRequired) {
      onPremiumRequired()
      return
    }
    onValueChange(personaKey)
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="grid grid-cols-1 gap-2">
        {SAINT_PERSONAS.map((persona) => {
          const isPremium = persona.key !== DEFAULT_PERSONA_KEY

          return (
            <button
              key={persona.key}
              type="button"
              onClick={() => handlePersonaClick(persona.key)}
              className={cn(
                "relative flex items-center justify-between w-full px-4 py-3 text-left border rounded-lg transition-all hover:bg-accent/50",
                value === persona.key
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{persona.display_name}</span>
                  {isPremium && (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {persona.notes}
                </div>
              </div>
              {value === persona.key && (
                <Check className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
              )}
            </button>
          )
        })}
        <button
          type="button"
          disabled
          className="relative flex items-center justify-between w-full px-4 py-3 text-left border rounded-lg opacity-50 cursor-not-allowed border-dashed"
        >
          <div className="flex-1">
            <div className="font-medium text-muted-foreground">Más santos en camino...</div>
            <div className="text-xs text-muted-foreground mt-1">
              Próximamente más opciones disponibles
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
