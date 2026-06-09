// ============================================================================
//  discord-notify — Edge Function Supabase
//  Envoie des MP Discord :
//   - new_application      -> à tous les gérants (nouvelle candidature)
//   - application_decision -> au candidat (accepté / refusé)
//  Sécurité : en-tête x-webhook-secret comparé à app_secrets.webhook_secret
//  (seuls les triggers Postgres connaissent ce secret).
// ============================================================================
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const SITE_URL = 'https://cyberdyl.github.io/staffweb/'
const DISCORD_API = 'https://discord.com/api/v10'

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function getSecret(key: string): Promise<string | null> {
  const { data } = await sb.from('app_secrets').select('value').eq('key', key).maybeSingle()
  return data?.value ?? null
}

async function sendDm(
  token: string,
  discordUserId: string,
  embed: Record<string, unknown>
): Promise<string> {
  const headers = {
    Authorization: `Bot ${token}`,
    'Content-Type': 'application/json',
  }
  const chRes = await fetch(`${DISCORD_API}/users/@me/channels`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ recipient_id: discordUserId }),
  })
  if (!chRes.ok) return `dm-channel ${chRes.status}: ${await chRes.text()}`
  const channel = await chRes.json()
  const msgRes = await fetch(`${DISCORD_API}/channels/${channel.id}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ embeds: [embed] }),
  })
  if (!msgRes.ok) return `dm-message ${msgRes.status}: ${await msgRes.text()}`
  return 'ok'
}

Deno.serve(async (req: Request) => {
  try {
    // --- Authentification webhook ---
    const expected = await getSecret('webhook_secret')
    if (!expected || req.headers.get('x-webhook-secret') !== expected) {
      return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
    }

    const token = await getSecret('discord_bot_token')
    const { type, application_id } = await req.json()

    if (!token) {
      console.log('discord_bot_token absent — notification ignorée', { type, application_id })
      return new Response(JSON.stringify({ skipped: 'no bot token' }), { status: 200 })
    }

    const { data: app } = await sb
      .from('applications')
      .select('*, profile:profiles!user_id(*)')
      .eq('id', application_id)
      .maybeSingle()
    if (!app) {
      return new Response(JSON.stringify({ error: 'application introuvable' }), { status: 200 })
    }

    const candidateName = app.pseudo ?? app.profile?.username ?? 'Candidat'
    const results: Record<string, string> = {}

    if (type === 'new_application') {
      // --- MP à tous les gérants + propriétaire ---
      const { data: managers } = await sb
        .from('profiles')
        .select('username, discord_id')
        .in('role', ['manager', 'owner'])
        .not('discord_id', 'is', null)

      const embed = {
        title: '📥 Nouvelle candidature staff',
        description:
          `**${candidateName}**` +
          (app.first_name ? ` (${app.first_name}` + (app.age ? `, ${app.age} ans)` : ')') : app.age ? ` (${app.age} ans)` : '') +
          ` vient de postuler sur **BlueStark**.\n\n` +
          (app.hours_per_week ? `🕒 Dispo : ${app.hours_per_week}\n` : '') +
          `👉 [Examiner la candidature](${SITE_URL}#/admin)`,
        color: 0x3385ff,
        footer: { text: 'BlueStark — Recrutement staff' },
      }
      for (const m of managers ?? []) {
        results[m.username ?? m.discord_id] = await sendDm(token, m.discord_id, embed)
      }
    } else if (type === 'application_decision') {
      // --- MP au candidat ---
      const target = app.profile?.discord_id ?? app.discord_user_id
      if (!target) {
        results.applicant = 'aucun discord_id'
      } else if (app.status === 'accepte') {
        results.applicant = await sendDm(token, target, {
          title: '🎉 Candidature acceptée !',
          description:
            `Félicitations **${candidateName}** ! Ta candidature staff **BlueStark** a été **acceptée**.\n` +
            `Un gérant va te contacter pour la suite.\n\n` +
            `👉 [Voir ma candidature](${SITE_URL}#/ma-candidature)`,
          color: 0x57f287,
          footer: { text: 'BlueStark — Recrutement staff' },
        })
      } else if (app.status === 'refuse') {
        results.applicant = await sendDm(token, target, {
          title: 'Candidature refusée',
          description:
            `Merci pour ta candidature **${candidateName}**. Après examen, elle n'a **pas été retenue** cette fois-ci.\n` +
            `Tu pourras retenter ta chance plus tard.\n\n` +
            `👉 [Détails](${SITE_URL}#/ma-candidature)`,
          color: 0xed4245,
          footer: { text: 'BlueStark — Recrutement staff' },
        })
      }
    }

    console.log(JSON.stringify({ type, application_id, results }))
    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('discord-notify error:', e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})
