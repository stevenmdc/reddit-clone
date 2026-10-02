import { Dialog } from '@headlessui/react'
import { Check, X } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { AVATARS, AvatarId, avatarSource } from '@/constants/avatars'
import { useAvatar } from './AvatarProvider'

export default function AvatarPicker({ onClose }: { onClose: () => void }) {
  const { avatar, saveAvatar } = useAvatar()
  const [selected, setSelected] = useState<AvatarId>(avatar)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true)
    setError('')
    try {
      await saveAvatar(selected)
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Impossible d’enregistrer votre avatar.')
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={() => { if (!saving) onClose() }} className='relative z-[60]'>
      <div className='fixed inset-0 bg-black/60' aria-hidden='true' />
      <div className='fixed inset-0 flex items-center justify-center overflow-y-auto p-4'>
        <Dialog.Panel className='w-full max-w-md rounded-2xl border bg-white p-5 shadow-xl dark:bg-[#181C1F]'>
          <div className='flex items-center justify-between gap-4'>
            <Dialog.Title className='text-lg font-semibold'>Choisir un avatar</Dialog.Title>
            <button
              type='button'
              aria-label='Fermer le choix d’avatar'
              disabled={saving}
              onClick={onClose}
              className='rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-[#2A3236] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50'
            >
              <X size={20} aria-hidden='true' />
            </button>
          </div>
          <Dialog.Description className='mt-1 text-sm text-neutral-500 dark:text-[#9BAEB9]'>
            Choisissez le personnage qui vous ressemble.
          </Dialog.Description>
          <div className='my-6 grid grid-cols-4 gap-3' role='group' aria-label='Avatars disponibles'>
            {AVATARS.map(({ id, label }) => (
              <button
                key={id}
                type='button'
                aria-label={label}
                aria-pressed={selected === id}
                disabled={saving}
                onClick={() => setSelected(id)}
                className={`relative aspect-square rounded-full transition duration-200 hover:scale-105 active:scale-95 motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:ring-offset-[#181C1F] ${selected === id ? 'ring-2 ring-orange-500 ring-offset-2' : 'ring-1 ring-neutral-200 hover:ring-orange-400 dark:ring-[#343A3E] dark:hover:ring-orange-400'}`}
              >
                <Image src={avatarSource(id)} alt='' width={128} height={128} unoptimized className='h-full w-full rounded-full object-cover' />
                {selected === id && <span className='absolute bottom-0 right-0 rounded-full bg-orange-500 p-1 text-white'><Check size={12} aria-hidden='true' /></span>}
              </button>
            ))}
          </div>
          {error && <p role='alert' className='mb-4 text-sm text-red-700 dark:text-red-400'>{error}</p>}
          <div className='flex justify-end gap-2'>
            <button type='button' onClick={onClose} disabled={saving} className='rounded-full border px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-[#2A3236] disabled:opacity-50'>Annuler</button>
            <button type='button' onClick={save} disabled={saving} className='rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50'>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
