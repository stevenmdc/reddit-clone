import { createContext, ReactNode, useContext, useState, useSyncExternalStore } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { AvatarId, isAvatarId } from '@/constants/avatars'

const STORAGE_KEY = 'reddit-guest-avatar'
const CHANGE_EVENT = 'reddit-avatar-change'
let guestFallback: AvatarId = 'corgi'
let guestStorageBlocked = false

function guestSnapshot(): AvatarId {
  if (guestStorageBlocked) return guestFallback
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return isAvatarId(saved) ? saved : 'corgi'
  } catch {
    return guestFallback
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      guestStorageBlocked = false
      guestFallback = isAvatarId(event.newValue) ? event.newValue : 'corgi'
      onChange()
    }
  }
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

const AvatarContext = createContext<{
  avatar: AvatarId
  saveAvatar: (avatar: AvatarId) => Promise<void>
} | null>(null)

export function AvatarProvider({ children }: { children: ReactNode }) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const guestAvatar = useSyncExternalStore(subscribe, guestSnapshot, () => 'corgi' as AvatarId)
  const [overrides, setOverrides] = useState<Record<string, AvatarId>>({})
  const savedAvatar: unknown = session?.user.user_metadata.avatar_id
  const avatar = session
    ? overrides[session.user.id] ?? (isAvatarId(savedAvatar) ? savedAvatar : 'corgi')
    : guestAvatar

  async function saveAvatar(next: AvatarId) {
    if (!isAvatarId(next)) throw new Error('Avatar invalide.')
    if (session) {
      const { error } = await supabase.auth.updateUser({ data: { avatar_id: next } })
      if (error) throw new Error('Impossible d’enregistrer votre avatar. Réessayez.')
      setOverrides((current) => ({ ...current, [session.user.id]: next }))
    } else {
      guestFallback = next
      try {
        localStorage.setItem(STORAGE_KEY, next)
        guestStorageBlocked = false
      } catch {
        guestStorageBlocked = true
        // Keep the selection for this visit when storage is unavailable.
      }
      window.dispatchEvent(new Event(CHANGE_EVENT))
    }
  }

  return <AvatarContext.Provider value={{ avatar, saveAvatar }}>{children}</AvatarContext.Provider>
}

export function useAvatar() {
  const context = useContext(AvatarContext)
  if (!context) throw new Error('useAvatar requires AvatarProvider.')
  return context
}
