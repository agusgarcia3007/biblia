'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PersonaSelect } from '@/components/persona-select'
import { Home, Loader2, LogOut, User as UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [defaultPersona, setDefaultPersona] = useState('augustin')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/auth')
        return
      }

      setUser(authUser)

      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('default_persona')
        .eq('user_id', authUser.id)
        .single()

      if (profile?.default_persona) {
        setDefaultPersona(profile.default_persona)
      }
    } catch (err) {
      console.error('Error loading user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!user) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          default_persona: defaultPersona,
          locale: 'es',
        })
        .eq('user_id', user.id)

      if (error) throw error

      alert('Configuración guardada exitosamente')
    } catch (err) {
      console.error('Error saving settings:', err)
      alert('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth')
    } catch (err) {
      console.error('Error logging out:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Configuración</h1>
          </div>
          <Button variant="ghost" onClick={() => router.push('/')}>
            <Home className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Usuario</CardTitle>
            <CardDescription>Detalles de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Correo electrónico</p>
              <p className="text-base">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Usuario desde</p>
              <p className="text-base">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferencias</CardTitle>
            <CardDescription>Configura tu experiencia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PersonaSelect
              value={defaultPersona}
              onValueChange={setDefaultPersona}
              label="Persona predeterminada"
              description="Selecciona el estilo que prefieres para las respuestas y oraciones"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button onClick={handleSaveSettings} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Configuración'
            )}
          </Button>

          <Button variant="outline" onClick={handleLogout} size="lg">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        {/* About */}
        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="text-base">Sobre la Aplicación</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Biblia Católica AI</strong> te ayuda a explorar las Sagradas Escrituras con
              la ayuda de la inteligencia artificial.
            </p>
            <p>
              Todas las respuestas están fundamentadas en la Biblia Católica en español, incluyendo
              los libros deuterocanónicos.
            </p>
            <p className="text-xs mt-4">Versión 1.0.0 - MVP</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
