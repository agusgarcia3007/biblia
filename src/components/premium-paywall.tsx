'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Crown, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface PremiumPaywallProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function PremiumPaywall({ open, onOpenChange, onSuccess }: PremiumPaywallProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Check if user is authenticated
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    if (open) {
      checkAuth()
    }
  }, [open])

  const handleCheckout = async () => {
    setIsLoading(true)

    try {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        // Store the intent to subscribe after login
        sessionStorage.setItem('redirectAfterAuth', 'subscribe')
        router.push('/login?redirect=/chat')
        return
      }

      // Create checkout session
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const data = await response.json()

      // Redirect to Polar checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Error al crear la sesión de pago. Por favor, inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-yellow-500/10 rounded-full">
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Función Premium
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Hablar con los santos es una función premium
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold">$4.99</span>
              <span className="text-muted-foreground">/mes</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Habla con San Agustín, Santa Teresa de Ávila y San Francisco de Asís
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Respuestas personalizadas según el estilo y sabiduría de cada santo
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Acceso ilimitado a todas las conversaciones
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Todas las funciones gratuitas incluidas
                </span>
              </div>
            </div>
          </div>

          {!isAuthenticated && !isCheckingAuth && (
            <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">¿No tienes cuenta?</p>
              <p className="text-xs">
                Serás redirigido para crear una cuenta o iniciar sesión antes de suscribirte.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleCheckout}
            disabled={isLoading || isCheckingAuth}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : isCheckingAuth ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : !isAuthenticated ? (
              'Continuar con cuenta'
            ) : (
              'Suscribirse ahora'
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
