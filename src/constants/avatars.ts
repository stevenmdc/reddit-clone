export const AVATARS = [
  { id: 'corgi', label: 'Corgi' },
  { id: 'dalmatian', label: 'Dalmatien' },
  { id: 'shiba', label: 'Shiba' },
  { id: 'bulldog', label: 'Bouledogue' },
  { id: 'husky', label: 'Husky' },
  { id: 'poodle', label: 'Caniche' },
  { id: 'dachshund', label: 'Teckel' },
  { id: 'golden', label: 'Golden retriever' },
] as const

export type AvatarId = (typeof AVATARS)[number]['id']

export function isAvatarId(value: unknown): value is AvatarId {
  return AVATARS.some((avatar) => avatar.id === value)
}

export function avatarSource(id: AvatarId) {
  return `/images/avatars/${id}.webp`
}
