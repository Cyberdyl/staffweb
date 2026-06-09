import { useEffect, useState } from 'react'
import { Loader2, CalendarPlus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from './Toast'
import { Modal } from './Modal'
import type { Application, Appointment } from '../lib/types'

function toLocalInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date()
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 16)
}

export function ScheduleModal({
  open,
  onClose,
  onSaved,
  applications,
  presetApplicationId,
  existing,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  applications: Application[]
  presetApplicationId?: string
  existing?: Appointment | null
}) {
  const { session } = useAuth()
  const { notify } = useToast()
  const [applicationId, setApplicationId] = useState('')
  const [when, setWhen] = useState(toLocalInput())
  const [duration, setDuration] = useState(30)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setApplicationId(existing?.application_id ?? presetApplicationId ?? '')
    setWhen(toLocalInput(existing?.scheduled_at))
    setDuration(existing?.duration_min ?? 30)
    setNote(existing?.note ?? '')
  }, [open, existing, presetApplicationId])

  async function save() {
    if (!applicationId) {
      notify('Choisis une candidature.', 'error')
      return
    }
    setSaving(true)
    const payload = {
      application_id: applicationId,
      manager_id: session!.user.id,
      scheduled_at: new Date(when).toISOString(),
      duration_min: duration,
      note: note || null,
      created_by: session!.user.id,
    }
    const { error } = existing
      ? await supabase.from('appointments').update(payload).eq('id', existing.id)
      : await supabase.from('appointments').insert(payload)
    setSaving(false)
    if (error) {
      notify('Erreur : ' + error.message, 'error')
      return
    }
    notify(existing ? 'Rendez-vous mis à jour.' : 'Rendez-vous planifié.', 'success')
    onSaved()
    onClose()
  }

  async function remove() {
    if (!existing) return
    setSaving(true)
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', existing.id)
    setSaving(false)
    if (error) {
      notify('Erreur : ' + error.message, 'error')
      return
    }
    notify('Rendez-vous supprimé.', 'info')
    onSaved()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? 'Modifier le rendez-vous' : 'Planifier un rendez-vous vocal'}
      footer={
        <>
          {existing && (
            <button onClick={remove} disabled={saving} className="btn-danger mr-auto">
              <Trash2 className="h-4 w-4" /> Supprimer
            </button>
          )}
          <button onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
            Enregistrer
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {!presetApplicationId && (
          <div>
            <label className="label">Candidat</label>
            <select
              className="input"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
            >
              <option value="">— Sélectionner —</option>
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.pseudo ?? a.profile?.username ?? 'Candidat'}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Date & heure</label>
            <input
              type="datetime-local"
              className="input"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Durée (min)</label>
            <input
              type="number"
              min={5}
              step={5}
              className="input"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
        </div>
        <div>
          <label className="label">Note (facultatif)</label>
          <textarea
            className="input min-h-[80px]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Salon vocal, points à aborder…"
          />
        </div>
      </div>
    </Modal>
  )
}
