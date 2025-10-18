import { useRouter } from 'next/navigation'

interface SavedState {
  path: string
  formData?: Record<string, any>
  timestamp: number
}

const STATE_KEY = 'auth_saved_state'
const STATE_TTL = 30 * 60 * 1000 // 30 minutos

/**
 * Guarda el estado actual antes de redirigir al login
 */
export function saveStateBeforeAuth(path: string, formData?: Record<string, any>) {
  const state: SavedState = {
    path,
    formData,
    timestamp: Date.now(),
  }

  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving state:', error)
  }
}

/**
 * Restaura el estado guardado después del login
 */
export function restoreSavedState(): SavedState | null {
  try {
    const saved = localStorage.getItem(STATE_KEY)
    if (!saved) return null

    const state: SavedState = JSON.parse(saved)

    // Verificar si el estado ha expirado
    if (Date.now() - state.timestamp > STATE_TTL) {
      localStorage.removeItem(STATE_KEY)
      return null
    }

    return state
  } catch (error) {
    console.error('Error restoring state:', error)
    return null
  }
}

/**
 * Limpia el estado guardado
 */
export function clearSavedState() {
  try {
    localStorage.removeItem(STATE_KEY)
  } catch (error) {
    console.error('Error clearing state:', error)
  }
}

/**
 * Maneja una respuesta 401 guardando el estado y redirigiendo al login
 */
export function handleUnauthorized(
  router: ReturnType<typeof useRouter>,
  currentPath: string,
  formData?: Record<string, any>
) {
  saveStateBeforeAuth(currentPath, formData)
  router.push('/auth')
}

/**
 * Función helper para verificar errores 401 en responses
 */
export async function fetchWithAuthCheck(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, options)

  if (response.status === 401) {
    // La redirección debe hacerse desde el componente que llama
    throw new Error('UNAUTHORIZED')
  }

  return response
}
