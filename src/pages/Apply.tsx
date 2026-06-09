import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Send, CheckCircle2, AlertTriangle, Loader2, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../components/Toast'
import { SectionTitle, Spinner } from '../components/ui'
import { SERVER_NAME } from '../lib/config'
import type { Application } from '../lib/types'

interface FormState {
  first_name: string
  pseudo: string
  discord_user_id: string
  age: string
  has_mic: boolean | null
  discovery: string
  fivem_since: string
  server_since: string
  playtime: string
  sanctioned: boolean | null
  sanctioned_reason: string
  was_staff: boolean | null
  staff_servers: string
  staff_role: string
  motivation: string
  qualities: string
  scenario: string
  why_you: string
  contribution: string
  hours_per_week: string
  availability: string
  rules_accepted: boolean
  extra: string
}

const EMPTY: FormState = {
  first_name: '',
  pseudo: '',
  discord_user_id: '',
  age: '',
  has_mic: null,
  discovery: '',
  fivem_since: '',
  server_since: '',
  playtime: '',
  sanctioned: null,
  sanctioned_reason: '',
  was_staff: null,
  staff_servers: '',
  staff_role: '',
  motivation: '',
  qualities: '',
  scenario: '',
  why_you: '',
  contribution: '',
  hours_per_week: '',
  availability: '',
  rules_accepted: false,
  extra: '',
}

function YesNo({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex gap-2">
      {[
        { v: true, l: 'Oui' },
        { v: false, l: 'Non' },
      ].map((opt) => (
        <button
          type="button"
          key={opt.l}
          onClick={() => onChange(opt.v)}
          className={`btn flex-1 ${
            value === opt.v
              ? 'bg-brand-600 text-white'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          {opt.l}
        </button>
      ))}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-4 p-6">
      <h2 className="font-display text-base font-bold text-brand-300">{title}</h2>
      {children}
    </div>
  )
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
    setForm((f) => ({
      ...f,
      pseudo: f.pseudo || (profile?.username ?? ''),
      discord_user_id: f.discord_user_id || (profile?.discord_id ?? ''),
    }))
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

    const missing: string[] = []
    if (!form.first_name.trim()) missing.push('Prénom')
    if (!form.pseudo.trim()) missing.push('Pseudo')
    if (!form.age) missing.push('Âge')
    if (form.has_mic === null) missing.push('Micro')
    if (form.sanctioned === null) missing.push('Déjà sanctionné')
    if (form.was_staff === null) missing.push('Déjà staff')
    if (!form.motivation.trim()) missing.push('Motivation')
    if (!form.qualities.trim()) missing.push('Qualités')
    if (!form.scenario.trim()) missing.push('Mise en situation')
    if (!form.hours_per_week.trim()) missing.push('Heures par semaine')
    if (!form.availability.trim()) missing.push('Horaires de disponibilité')
    if (missing.length > 0) {
      notify(`Champs obligatoires manquants : ${missing.join(', ')}.`, 'error')
      return
    }
    if (!form.rules_accepted) {
      notify('Tu dois avoir lu et accepté le règlement du serveur.', 'error')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('applications').insert({
      user_id: session!.user.id,
      first_name: form.first_name.trim(),
      pseudo: form.pseudo.trim(),
      discord_user_id: form.discord_user_id.trim() || null,
      age: form.age ? Number(form.age) : null,
      has_mic: form.has_mic,
      discovery: form.discovery.trim() || null,
      fivem_since: form.fivem_since.trim() || null,
      server_since: form.server_since.trim() || null,
      playtime: form.playtime.trim() || null,
      sanctioned: form.sanctioned,
      sanctioned_reason: form.sanctioned ? form.sanctioned_reason.trim() || null : null,
      was_staff: form.was_staff,
      staff_servers: form.was_staff ? form.staff_servers.trim() || null : null,
      staff_role: form.was_staff ? form.staff_role.trim() || null : null,
      motivation: form.motivation.trim(),
      qualities: form.qualities.trim(),
      scenario: form.scenario.trim(),
      why_you: form.why_you.trim() || null,
      contribution: form.contribution.trim() || null,
      hours_per_week: form.hours_per_week.trim(),
      availability: form.availability.trim(),
      rules_accepted: form.rules_accepted,
      extra: form.extra.trim() || null,
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
        Candidature staff — {SERVER_NAME} FA
      </SectionTitle>

      <form onSubmit={submit} className="space-y-5">
        {/* ------------------------------------------------ Toi */}
        <Card title="👤 Toi">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Prénom *</label>
              <input
                className="input"
                value={form.first_name}
                onChange={(e) => set('first_name', e.target.value)}
                placeholder="Ton prénom"
              />
            </div>
            <div>
              <label className="label">Pseudo *</label>
              <input
                className="input"
                value={form.pseudo}
                onChange={(e) => set('pseudo', e.target.value)}
                placeholder="Ton pseudo"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">ID Discord</label>
              <input
                className="input font-mono"
                value={form.discord_user_id}
                onChange={(e) => set('discord_user_id', e.target.value)}
                placeholder="Rempli automatiquement"
              />
              <p className="mt-1 text-xs text-slate-500">
                Pré-rempli via ta connexion Discord.
              </p>
            </div>
            <div>
              <label className="label">Quel âge as-tu ? *</label>
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
          <div>
            <label className="label">
              Possèdes-tu un micro fonctionnel et de bonne qualité ? *
            </label>
            <YesNo value={form.has_mic} onChange={(v) => set('has_mic', v)} />
          </div>
        </Card>

        {/* ------------------------------------------------ Parcours FiveM */}
        <Card title={`🎮 Ton parcours sur FiveM`}>
          <div>
            <label className="label">Comment as-tu découvert {SERVER_NAME} FA ?</label>
            <input
              className="input"
              value={form.discovery}
              onChange={(e) => set('discovery', e.target.value)}
              placeholder="Un ami, TikTok, top serveurs…"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Depuis combien de temps joues-tu sur FiveM ?</label>
              <input
                className="input"
                value={form.fivem_since}
                onChange={(e) => set('fivem_since', e.target.value)}
                placeholder="ex. 3 ans"
              />
            </div>
            <div>
              <label className="label">
                Depuis combien de temps joues-tu sur {SERVER_NAME} FA ?
              </label>
              <input
                className="input"
                value={form.server_since}
                onChange={(e) => set('server_since', e.target.value)}
                placeholder="ex. 6 mois"
              />
            </div>
          </div>
          <div>
            <label className="label">Temps de jeu approximatif sur le serveur :</label>
            <input
              className="input"
              value={form.playtime}
              onChange={(e) => set('playtime', e.target.value)}
              placeholder="ex. 200 heures"
            />
          </div>
          <div>
            <label className="label">As-tu déjà été sanctionné sur un serveur ? *</label>
            <YesNo value={form.sanctioned} onChange={(v) => set('sanctioned', v)} />
          </div>
          {form.sanctioned && (
            <div>
              <label className="label">Si oui, explique la raison :</label>
              <textarea
                className="input min-h-[80px]"
                value={form.sanctioned_reason}
                onChange={(e) => set('sanctioned_reason', e.target.value)}
                placeholder="Serveur, sanction reçue, contexte…"
              />
            </div>
          )}
        </Card>

        {/* ------------------------------------------------ Expérience staff */}
        <Card title="🛡️ Ton expérience staff">
          <div>
            <label className="label">As-tu déjà été staff sur un serveur FiveM ? *</label>
            <YesNo value={form.was_staff} onChange={(v) => set('was_staff', v)} />
          </div>
          {form.was_staff && (
            <>
              <div>
                <label className="label">Si oui, sur quel(s) serveur(s) ?</label>
                <input
                  className="input"
                  value={form.staff_servers}
                  onChange={(e) => set('staff_servers', e.target.value)}
                  placeholder="Nom(s) du/des serveur(s)"
                />
              </div>
              <div>
                <label className="label">Quel poste occupais-tu ?</label>
                <input
                  className="input"
                  value={form.staff_role}
                  onChange={(e) => set('staff_role', e.target.value)}
                  placeholder="Modérateur, Admin, Gérant…"
                />
              </div>
            </>
          )}
        </Card>

        {/* ------------------------------------------------ Questions de fond */}
        <Card title="💬 Questions de fond">
          <div>
            <label className="label">
              Pourquoi souhaites-tu rejoindre l’équipe staff de {SERVER_NAME} FA ? *
            </label>
            <textarea
              className="input min-h-[110px]"
              value={form.motivation}
              onChange={(e) => set('motivation', e.target.value)}
              placeholder="Tes motivations…"
            />
          </div>
          <div>
            <label className="label">
              Quelles sont, selon toi, les qualités indispensables pour être un bon
              staff ? *
            </label>
            <textarea
              className="input min-h-[90px]"
              value={form.qualities}
              onChange={(e) => set('qualities', e.target.value)}
            />
          </div>
          <div>
            <label className="label">
              Comment réagirais-tu face à un joueur insultant ou provocateur ? *
            </label>
            <textarea
              className="input min-h-[90px]"
              value={form.scenario}
              onChange={(e) => set('scenario', e.target.value)}
              placeholder="Décris ta réaction étape par étape…"
            />
          </div>
          <div>
            <label className="label">
              Pourquoi devrions-nous te choisir toi plutôt qu’un autre candidat ?
            </label>
            <textarea
              className="input min-h-[90px]"
              value={form.why_you}
              onChange={(e) => set('why_you', e.target.value)}
            />
          </div>
          <div>
            <label className="label">
              Que peux-tu apporter à la communauté {SERVER_NAME} FA ?
            </label>
            <textarea
              className="input min-h-[90px]"
              value={form.contribution}
              onChange={(e) => set('contribution', e.target.value)}
            />
          </div>
        </Card>

        {/* ------------------------------------------------ Disponibilités */}
        <Card title="🕒 Tes disponibilités">
          <div>
            <label className="label">
              Combien d’heures par semaine peux-tu consacrer au serveur ? *
            </label>
            <input
              className="input"
              value={form.hours_per_week}
              onChange={(e) => set('hours_per_week', e.target.value)}
              placeholder="ex. 15h / semaine"
            />
          </div>
          <div>
            <label className="label">Quels sont tes horaires de disponibilité ? *</label>
            <textarea
              className="input min-h-[80px]"
              value={form.availability}
              onChange={(e) => set('availability', e.target.value)}
              placeholder="ex. semaine 18h-23h, week-end après-midi et soir"
            />
          </div>
        </Card>

        {/* ------------------------------------------------ Règlement + extra */}
        <Card title="📜 Pour finir">
          <button
            type="button"
            onClick={() => set('rules_accepted', !form.rules_accepted)}
            className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition ${
              form.rules_accepted
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : 'border-white/10 bg-night-900/60 text-slate-300 hover:bg-white/5'
            }`}
          >
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                form.rules_accepted
                  ? 'border-emerald-400 bg-emerald-500 text-night-950'
                  : 'border-white/20'
              }`}
            >
              {form.rules_accepted && <ShieldCheck className="h-3.5 w-3.5" />}
            </span>
            J’ai lu et j’accepte le règlement du serveur *
          </button>
          <div>
            <label className="label">
              As-tu quelque chose à ajouter pour appuyer ta candidature ?
            </label>
            <textarea
              className="input min-h-[80px]"
              value={form.extra}
              onChange={(e) => set('extra', e.target.value)}
              placeholder="Tout ce que tu veux ajouter…"
            />
          </div>
        </Card>

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
