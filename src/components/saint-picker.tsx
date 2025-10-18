'use client'

import { SAINT_PERSONAS } from '@/lib/personas'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface SaintPickerProps {
  value: string
  onValueChange: (value: string) => void
  label?: string
  description?: string
}

export function SaintPicker({
  value,
  onValueChange,
  label = 'Persona de santo',
  description,
}: SaintPickerProps) {
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="grid grid-cols-1 gap-2">
        {SAINT_PERSONAS.map((persona) => (
          <button
            key={persona.key}
            type="button"
            onClick={() => onValueChange(persona.key)}
            className={cn(
              "relative flex items-center justify-between w-full px-4 py-3 text-left border rounded-lg transition-all hover:bg-accent/50",
              value === persona.key
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex-1">
              <div className="font-medium">{persona.display_name}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {persona.notes}
              </div>
            </div>
            {value === persona.key && (
              <Check className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
            )}
          </button>
        ))}
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
