import { useEffect, useState } from 'react'
import { Loader2, UserPlus, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from './Toast'
import { Modal } from './Modal'
import { POLES } from '../lib/config'
import type { Grade, IgPermission, StaffMember } from '../lib/types'

export function StaffModal({
  open,
  onClose,
  onSaved,
  grades,
  permissions,
  existing,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  grades: Grade[]
  permissions: IgPermission[]
  existing?: StaffMember | null
}) {
  const { session } = useAuth()
  const { notify } = useToast()
  const [uniqueId, setUniqueId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [discordId, setDiscordId] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [pole, setPole] = useState('')
  const [permissionId, setPermissionId] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setUniqueId(existing?.unique_id ?? '')
    setDisplayName(existing?.display_name ?? '')
    setDiscordId(existing?.discord_id ?? '')
    setGradeId(existing?.grade_id ?? '')
    setPole(existing?.pole ?? '')
    setPermissionId(existing?.permission_id ?? '')
    setAuthorized(existing?.perm_authorized ?? false)
    setNotes(existing?.notes ?? '')
  }, [open, existing])

  const selectedGrade = grades.find((g) => g.id === gradeId)

  function onGradeChange(id: string) {
    setGradeId(id)
    const g = grades.find((x) => x.id === id)
    // Pré-remplit la permission par défaut du grade (création/changement)
    setPermissionId(g?.default_permission_id ?? '')
    if (!g?.has_pole) setPole('')
  }

  async function save() {
    if (!uniqueId.trim() || !displayName.trim()) {
      notify('L’ID Unique et le pseudo sont obligatoires.', 'error')
      return
    }
    setSaving(true)
    const payload = {
      unique_id: uniqueId.trim(),
      display_name: displayName.trim(),
      discord_id: discordId.trim() || null,
      grade_id: gradeId || null,
      pole: pole || null,
      permission_id: permissionId || null,
      perm_authorized: authorized,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = existing
      ? await supabase.from('staff_members').update(payload).eq('id', existing.id)
      : await supabase
          .from('staff_members')
          .insert({ ...payload, added_by: session!.user.id })
    setSaving(false)
    if (error) {
      const msg = error.message.includes('duplicate')
        ? 'Cet ID Unique existe déjà.'
        : error.message
      notify('Erreur : ' + msg, 'error')
      return
    }
    notify(existing ? 'Staff mis à jour.' : 'Staff ajouté à l’effectif.', 'success')
    onSaved()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? 'Modifier le staff' : 'Ajouter un staff'}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : existing ? (
              <Save className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Enregistrer
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">ID Unique *</label>
            <input
              className="input font-mono"
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              placeholder="ex. license:xxxx / ID serveur"
            />
            <p className="mt-1 text-xs text-slate-500">
              Identifiant FiveM unique (license, steam, ID interne…).
            </p>
          </div>
          <div>
            <label className="label">Pseudo *</label>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Pseudo du staff"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Grade</label>
            <select
              className="input"
              value={gradeId}
              onChange={(e) => onGradeChange(e.target.value)}
            >
              <option value="">— Aucun —</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                  {g.short ? ` (${g.short})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">
              Pôle {selectedGrade && !selectedGrade.has_pole && (
                <span className="text-slate-600">(non requis)</span>
              )}
            </label>
            <select
              className="input"
              value={pole}
              onChange={(e) => setPole(e.target.value)}
              disabled={!selectedGrade?.has_pole}
            >
              <option value="">—</option>
              {Object.entries(POLES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Permission IG</label>
            <select
              className="input"
              value={permissionId}
              onChange={(e) => setPermissionId(e.target.value)}
            >
              <option value="">Aucune</option>
              {permissions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Autorisé à jouer la perm</label>
            <div className="flex gap-2">
              {[
                { v: true, l: 'Oui' },
                { v: false, l: 'Non' },
              ].map((o) => (
                <button
                  type="button"
                  key={o.l}
                  onClick={() => setAuthorized(o.v)}
                  className={`btn flex-1 ${
                    authorized === o.v
                      ? 'bg-brand-600 text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="label">Discord ID (facultatif)</label>
          <input
            className="input font-mono"
            value={discordId}
            onChange={(e) => setDiscordId(e.target.value)}
            placeholder="123456789012345678"
          />
        </div>

        <div>
          <label className="label">Notes (facultatif)</label>
          <textarea
            className="input min-h-[70px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
