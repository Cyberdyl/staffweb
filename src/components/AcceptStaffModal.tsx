import { useEffect, useState } from 'react'
import { Loader2, UserPlus, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from './Toast'
import { Modal } from './Modal'
import { useReference } from '../lib/useReference'
import { POLES } from '../lib/config'
import type { Application } from '../lib/types'

// Modale affichée quand un gérant accepte une candidature :
// accepte ET (optionnellement) ajoute directement le candidat à l'effectif.
export function AcceptStaffModal({
  open,
  onClose,
  application,
  onAccepted,
}: {
  open: boolean
  onClose: () => void
  application: Application | null
  onAccepted: () => void
}) {
  const { session } = useAuth()
  const { notify } = useToast()
  const { grades, permissions } = useReference()

  const [uniqueId, setUniqueId] = useState('')
  const [gradeId, setGradeId] = useState('helpeur')
  const [pole, setPole] = useState('')
  const [permissionId, setPermissionId] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [staffSince, setStaffSince] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setUniqueId('')
    setGradeId('helpeur')
    const g = grades.find((x) => x.id === 'helpeur')
    setPermissionId(g?.default_permission_id ?? '')
    setPole('')
    setAuthorized(false)
    setStaffSince(new Date().toISOString().slice(0, 10))
  }, [open, grades])

  if (!application) return null

  const displayName =
    application.pseudo ?? application.profile?.username ?? 'Candidat'
  const selectedGrade = grades.find((g) => g.id === gradeId)

  function onGradeChange(id: string) {
    setGradeId(id)
    const g = grades.find((x) => x.id === id)
    setPermissionId(g?.default_permission_id ?? '')
    if (!g?.has_pole) setPole('')
  }

  async function acceptApplication(): Promise<boolean> {
    const { error } = await supabase
      .from('applications')
      .update({ status: 'accepte', reviewed_by: session!.user.id })
      .eq('id', application!.id)
    if (error) {
      notify('Erreur : ' + error.message, 'error')
      return false
    }
    return true
  }

  // Accepter SANS ajouter à l'effectif
  async function acceptOnly() {
    setSaving(true)
    const ok = await acceptApplication()
    setSaving(false)
    if (!ok) return
    notify('Candidature acceptée. Le candidat reçoit un MP Discord. 🎉', 'success')
    onAccepted()
    onClose()
  }

  // Accepter + ajouter à l'effectif
  async function acceptAndAdd() {
    if (!uniqueId.trim()) {
      notify('L’ID Unique est obligatoire pour l’ajouter à l’effectif.', 'error')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('staff_members').insert({
      unique_id: uniqueId.trim(),
      display_name: displayName,
      discord_id: application!.profile?.discord_id ?? application!.discord_user_id ?? null,
      profile_id: application!.user_id,
      grade_id: gradeId || null,
      pole: pole || null,
      permission_id: permissionId || null,
      perm_authorized: authorized,
      status: 'actif',
      staff_since: staffSince || null,
      added_by: session!.user.id,
    })
    if (error) {
      setSaving(false)
      const msg = error.message.includes('duplicate')
        ? 'Cet ID Unique existe déjà dans l’effectif.'
        : error.message
      notify('Erreur : ' + msg, 'error')
      return
    }
    const ok = await acceptApplication()
    setSaving(false)
    if (!ok) return
    notify(`${displayName} accepté et ajouté à l’effectif ! Il reçoit un MP Discord. 🎉`, 'success')
    onAccepted()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Accepter ${displayName}`}
      footer={
        <>
          <button onClick={onClose} disabled={saving} className="btn-ghost mr-auto">
            Annuler
          </button>
          <button onClick={acceptOnly} disabled={saving} className="btn-ghost">
            <Check className="h-4 w-4" /> Accepter seulement
          </button>
          <button onClick={acceptAndAdd} disabled={saving} className="btn-primary">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Accepter + ajouter à l’effectif
          </button>
        </>
      }
    >
      <p className="mb-4 rounded-xl bg-brand-600/10 p-3 text-sm text-brand-100">
        Renseigne son <strong>ID Unique</strong> et son grade de départ pour
        l’ajouter directement à la hiérarchie. Le candidat sera prévenu par MP
        Discord automatiquement.
      </p>

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
          </div>
          <div>
            <label className="label">Staff depuis</label>
            <input
              type="date"
              className="input"
              value={staffSince}
              onChange={(e) => setStaffSince(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Grade de départ</label>
            <select
              className="input"
              value={gradeId}
              onChange={(e) => onGradeChange(e.target.value)}
            >
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
              Pôle{' '}
              {selectedGrade && !selectedGrade.has_pole && (
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
      </div>
    </Modal>
  )
}
