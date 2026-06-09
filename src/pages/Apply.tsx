import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Send, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../components/Toast'
import { SectionTitle, Spinner } from '../components/ui'
import type { Application } from '../lib/types'

interface FormState {
  discord_tag: string
  age: string
  timezone: string
  availability: string
  experience: string
  motivation: string
  scenario: string
  tools_knowledge: string
  has_mic: boolean | null
  already_sanctioned: string
  extra: string
}

const EMPTY: FormState = {
  discord_tag: '',
  age: '',
  timezone: '',
  availability: '',
  experience: '',
  motivation: '',
  scenario: '',
  tools_knowledge: '',
  has_mic: null,
  already_sanctioned: '',
  extra: '',
}

export default function Apply() {
  const { session, profile } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(EMPTY)
  const [existing, setExisting] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm((f) => ({ ...f, discord_tag: profile?.username ?? '' }))
  }, [profile])

  useEffect(() => {
    let active = true
    supabase
      .from('applications')
      .select('*')
      .eq('user_id', session!.user.id)
      .neq('status', 'refuse')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (active) {
          setExisting((data?.[0] as Application) ?? null)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [session])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.age || !form.timezone || !form.availability || !form.motivation) {
      notify('Merci de remplir tous les champs obligatoires (*).', 'error')
      return
    }
    if (form.has_mic === null) {
      notify('Indique si tu as un micro fonctionnel.', 'error')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('applications').insert({
      user_id: session!.user.id,
      discord_tag: form.discord_tag || null,
      age: form.age ? Number(form.age) : null,
      timezone: form.timezone || null,
      availability: form.availability || null,
      experience: form.experience || null,
      motivation: form.motivation || null,
      scenario: form.scenario || null,
      tools_knowledge: form.tools_knowledge || null,
      has_mic: form.has_mic,
      already_sanctioned: form.already_sanctioned || null,
      extra: form.extra || null,
    })
    setSubmitting(false)
    if (error) {
      notify('Erreur lors de l’envoi : ' + error.message, 'error')
      return
    }
    notify('Candidature envoyée ! Bonne chance 🍀', 'success')
    navigate('/ma-candidature')
  }

  if (loading) return <Spinner label="Chargement…" />

  if (existing) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card flex flex-col items-center gap-4 p-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          <h2 className="font-display text-xl font-bold text-white">
            Tu as déjà une candidature en cours
          </h2>
          <p className="text-sm text-slate-400">
            Inutile d’en renvoyer une autre. Tu peux suivre son avancement à
            tout moment.
          </p>
          <Link to="/ma-candidature" className="btn-primary">
            Voir ma candidature
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle hint="Sois honnête et précis : c’est ce qui fait la différence.">
        Candidature staff
      </SectionTitle>

      <form onSubmit={submit} className="space-y-5">
        <div className="card space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Pseudo Discord</label>
              <input
                className="input"
                value={form.discord_tag}
                onChange={(e) => set('discord_tag', e.target.value)}
                placeholder="TonPseudo"
              />
            </div>
            <div>
              <label className="label">Âge *</label>
              <input
                type="number"
                min={10}
                max={99}
                className="input"
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
                placeholder="16"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Pays / fuseau horaire *</label>
              <input
                className="input"
                value={form.timezone}
                onChange={(e) => set('timezone', e.target.value)}
                placeholder="France (UTC+1)"
              />
            </div>
            <div>
              <label className="label">Disponibilités *</label>
              <input
                className="input"
                value={form.availability}
                onChange={(e) => set('availability', e.target.value)}
                placeholder="≈ 15h / semaine, surtout le soir"
              />
            </div>
          </div>

          <div>
            <label className="label">Micro fonctionnel ? *</label>
            <div className="flex gap-2">
              {[
                { v: true, l: 'Oui' },
                { v: false, l: 'Non' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.l}
                  onClick={() => set('has_mic', opt.v)}
                  className={`btn flex-1 ${
                    form.has_mic === opt.v
                      ? 'bg-brand-600 text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <div>
            <label className="label">Pourquoi veux-tu devenir staff ? *</label>
            <textarea
              className="input min-h-[110px]"
              value={form.motivation}
              onChange={(e) => set('motivation', e.target.value)}
              placeholder="Tes motivations, ce que tu veux apporter à l’équipe…"
            />
          </div>
          <div>
            <label className="label">
              Expérience staff précédente (autres serveurs)
            </label>
            <textarea
              className="input min-h-[90px]"
              value={form.experience}
              onChange={(e) => set('experience', e.target.value)}
              placeholder="Serveurs, grades occupés, durée…"
            />
          </div>
          <div>
            <label className="label">
              Mise en situation : un joueur insulte un autre en vocal, que
              fais-tu ?
            </label>
            <textarea
              className="input min-h-[90px]"
              value={form.scenario}
              onChange={(e) => set('scenario', e.target.value)}
              placeholder="Décris ta procédure de modération…"
            />
          </div>
          <div>
            <label className="label">
              Connais-tu les outils (txAdmin, EasyAdmin) ?
            </label>
            <input
              className="input"
              value={form.tools_knowledge}
              onChange={(e) => set('tools_knowledge', e.target.value)}
              placeholder="Niveau de maîtrise, outils déjà utilisés…"
            />
          </div>
          <div>
            <label className="label">As-tu déjà été sanctionné en jeu ?</label>
            <input
              className="input"
              value={form.already_sanctioned}
              onChange={(e) => set('already_sanctioned', e.target.value)}
              placeholder="Non / Oui (précise)"
            />
          </div>
          <div>
            <label className="label">Informations complémentaires</label>
            <textarea
              className="input min-h-[80px]"
              value={form.extra}
              onChange={(e) => set('extra', e.target.value)}
              placeholder="Tout ce que tu veux ajouter…"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          Vérifie tes réponses : tu ne pourras pas les modifier après l’envoi.
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Envoyer ma candidature
        </button>
      </form>
    </div>
  )
}
