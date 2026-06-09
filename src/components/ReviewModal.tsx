import { useEffect, useState } from 'react'
import { Loader2, Flag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from './Toast'
import { Modal } from './Modal'
import { REVIEW_TYPE } from '../lib/labels'
import type { ReviewType, StaffMember } from '../lib/types'

const TYPES: ReviewType[] = ['avertissement', 'up', 'down', 'vire', 'note']

export function ReviewModal({
  open,
  onClose,
  onSaved,
  staff,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  staff: StaffMember | null
}) {
  const { session } = useAuth()
  const { notify } = useToast()
  const [type, setType] = useState<ReviewType>('avertissement')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setType('avertissement')
      setReason('')
    }
  }, [open])

  if (!staff) return null

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('staff_reviews').insert({
      staff_member_id: staff!.id,
      type,
      reason: reason.trim() || null,
      status: 'a_traiter',
      created_by: session!.user.id,
    })
    setSaving(false)
    if (error) return notify('Erreur : ' + error.message, 'error')
    notify('Ajouté à la prochaine réunion.', 'success')
    onSaved()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Signaler — ${staff.display_name}`}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
            Ajouter à la réunion
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Type</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`btn text-xs ${
                  type === t
                    ? 'bg-brand-600 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span>{REVIEW_TYPE[t].emoji}</span>
                {REVIEW_TYPE[t].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Motif</label>
          <textarea
            className="input min-h-[90px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Précise la raison (visible en réunion)…"
          />
        </div>
      </div>
    </Modal>
  )
}
