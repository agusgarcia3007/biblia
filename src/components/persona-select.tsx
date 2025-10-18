'use client'

import { SAINT_PERSONAS } from '@/lib/personas'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface PersonaSelectProps {
  value: string
  onValueChange: (value: string) => void
  label?: string
  description?: string
}

export function PersonaSelect({
  value,
  onValueChange,
  label = 'Persona de santo',
  description,
}: PersonaSelectProps) {
  return (
    <div className="space-y-2">
      {label && <Label htmlFor="persona-select">{label}</Label>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id="persona-select" className="w-full">
          <SelectValue placeholder="Selecciona una persona" />
        </SelectTrigger>
        <SelectContent>
          {SAINT_PERSONAS.map((persona) => (
            <SelectItem key={persona.key} value={persona.key}>
              {persona.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
