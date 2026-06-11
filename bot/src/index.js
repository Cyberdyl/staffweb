// ============================================================================
//  Bot Discord BlueStark — synchronisation staff <-> Discord
//
//  Site -> Discord :
//   - Ajout/modif dans l'effectif (staff_members) -> attribue les rôles :
//     Staff de base + grade + pôle + perm IG (perm seulement si "autorisé").
//   - ⛔ Membre avec le rôle "Blacklisté Staff" -> aucun rôle + note auto.
//   - Recrutement (INSERT) ET changement de perm/grade (UPDATE) -> message dans
//     le salon "demande de perm" : UUID + @joueur + @rôle-staff-à-prévenir
//     + grade + perm couleur.
//   - Suppression/départ -> retire les rôles gérés.
//
//  Discord -> Site / modération :
//   - Rôle "Avertissement 1/2/3" ajouté à un staff -> avertissement auto au dossier.
//   - Salon "blacklist" : tout ID Discord posté -> BAN auto ("Membre blacklisté - Spam/Pub").
//
//  Maintenance :
//   - Reconciliation complète au démarrage + toutes les 10 min.
//   - Keepalive base toutes les 72 h (anti mise en veille Supabase).
//
//  Le bot ne gère QUE les rôles mappés en base. Il ne touche jamais aux rôles
//  Avertissement / Blacklist (lecture seule pour ceux-là).
// ============================================================================
import 'dotenv/config'
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Events,
} from 'discord.js'
import { createClient } from '@supabase/supabase-js'

const {
  DISCORD_BOT_TOKEN,
  GUILD_ID,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env

for (const [k, v] of Object.entries({ DISCORD_BOT_TOKEN, GUILD_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY })) {
  if (!v) {
    console.error(`[config] Variable d'environnement manquante : ${k}`)
    process.exit(1)
  }
}

const BAN_REASON = 'Membre blacklisté - Spam/Pub'
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

// ---------------------------------------------------------------- Mappings
let grades = new Map()
let perms = new Map()
let config = {}

async function loadMappings() {
  const [g, p, c] = await Promise.all([
    sb.from('grades').select('*'),
    sb.from('ig_permissions').select('*'),
    sb.from('app_config').select('*'),
  ])
  grades = new Map((g.data ?? []).map((x) => [x.id, x]))
  perms = new Map((p.data ?? []).map((x) => [x.id, x]))
  config = Object.fromEntries((c.data ?? []).map((x) => [x.key, x.value]))
}

function managedRoleIds() {
  const ids = new Set()
  for (const g of grades.values()) if (g.discord_role_id) ids.add(g.discord_role_id)
  for (const p of perms.values()) if (p.discord_role_id) ids.add(p.discord_role_id)
  for (const k of ['role_staff_base', 'role_pole_L', 'role_pole_I', 'role_pole_E']) {
    if (config[k]) ids.add(config[k])
  }
  return ids
}

function desiredRoles(row) {
  if (!row || !['actif', 'suspendu'].includes(row.status)) return new Set()
  const ids = new Set()
  if (config.role_staff_base) ids.add(config.role_staff_base)
  const g = row.grade_id ? grades.get(row.grade_id) : null
  if (g?.discord_role_id) ids.add(g.discord_role_id)
  if (row.pole && config[`role_pole_${row.pole}`]) ids.add(config[`role_pole_${row.pole}`])
  if (row.permission_id && row.perm_authorized) {
    const p = perms.get(row.permission_id)
    if (p?.discord_role_id) ids.add(p.discord_role_id)
  }
  return ids
}

async function getGuild() {
  return client.guilds.fetch(GUILD_ID)
}

async function fetchMember(discordId) {
  if (!discordId) return null
  try {
    const guild = await getGuild()
    return await guild.members.fetch(discordId)
  } catch {
    return null
  }
}

// ------------------------------------------------------- Sync d'un staff
async function syncMember(row, { silent = false } = {}) {
  if (!row?.discord_id) {
    if (!silent) console.log(`[sync] ${row?.display_name ?? '?'} : pas de Discord ID`)
    return
  }
  const member = await fetchMember(row.discord_id)
  if (!member) {
    if (!silent) console.log(`[sync] ${row.display_name} : pas sur le serveur`)
    return
  }

  if (config.role_blacklist && member.roles.cache.has(config.role_blacklist)) {
    console.log(`[sync] ⛔ ${row.display_name} Blacklisté Staff : rôles non attribués`)
    await sb.from('staff_reviews').insert({
      staff_member_id: row.id,
      type: 'note',
      status: 'acte',
      reason: '⛔ Rôle « Blacklisté Staff » détecté sur Discord — le bot a refusé d’attribuer les rôles.',
    })
    return
  }

  const desired = desiredRoles(row)
  const managed = managedRoleIds()
  const toAdd = [...desired].filter((r) => !member.roles.cache.has(r))
  const toRemove = [...managed].filter((r) => member.roles.cache.has(r) && !desired.has(r))

  for (const r of toAdd) {
    await member.roles.add(r).catch((e) => console.error(`[sync] +${r} -> ${row.display_name} : ${e.message}`))
  }
  for (const r of toRemove) {
    await member.roles.remove(r).catch((e) => console.error(`[sync] -${r} -> ${row.display_name} : ${e.message}`))
  }
  if (!silent) console.log(`[sync] ${row.display_name} : +${toAdd.length} / -${toRemove.length} rôle(s)`)
}

async function removeAllManaged(row) {
  if (!row?.discord_id) return
  const member = await fetchMember(row.discord_id)
  if (!member) return
  for (const r of managedRoleIds()) {
    if (member.roles.cache.has(r)) {
      await member.roles.remove(r).catch((e) => console.error(`[sync] -${r} : ${e.message}`))
    }
  }
  console.log(`[sync] rôles staff retirés pour ${row.display_name}`)
}

// --------------------------------------------- Message "demande de perm"
async function postPermRequest(row, reason) {
  if (!config.announce_channel_id) return
  try {
    const channel = await client.channels.fetch(config.announce_channel_id)
    const g = row.grade_id ? grades.get(row.grade_id) : null
    const p = row.permission_id ? perms.get(row.permission_id) : null
    const color = parseInt((p?.color ?? g?.color ?? '#3385ff').replace('#', ''), 16)

    const pingUser = row.discord_id ? `<@${row.discord_id}>` : ''
    const pingRole = config.role_perm_ping ? `<@&${config.role_perm_ping}>` : ''

    const embed = new EmbedBuilder()
      .setTitle('🎚️ Demande de permission')
      .setDescription(
        [
          `**UUID :** \`${row.unique_id}\``,
          row.discord_id ? `**Joueur :** <@${row.discord_id}>` : null,
          `**Grade :** ${g ? g.label + (g.short ? ` (${g.short})` : '') : '—'}`,
          `**Permission IG à poser :** ${p ? `**${p.label}**` : 'Aucune'}` +
            (p ? (row.perm_authorized ? ' ✅ autorisée' : ' 🔒 en attente d’autorisation') : ''),
          reason ? `*${reason}*` : null,
        ]
          .filter(Boolean)
          .join('\n')
      )
      .setColor(color)
      .setFooter({ text: 'BlueStark — Gestion staff' })
      .setTimestamp()

    await channel.send({
      content: [pingUser, pingRole].filter(Boolean).join(' '),
      embeds: [embed],
      allowedMentions: {
        users: row.discord_id ? [row.discord_id] : [],
        roles: config.role_perm_ping ? [config.role_perm_ping] : [],
      },
    })
    console.log(`[perm] demande postée pour ${row.display_name} (${reason})`)
  } catch (e) {
    console.error(`[perm] échec : ${e.message}`)
  }
}

function permRelevantChange(oldRow, newRow) {
  return (
    oldRow.permission_id !== newRow.permission_id ||
    oldRow.perm_authorized !== newRow.perm_authorized ||
    oldRow.grade_id !== newRow.grade_id ||
    oldRow.pole !== newRow.pole
  )
}

// ------------------------------------------- Avertissements Discord -> site
async function handleMemberUpdate(oldMember, newMember) {
  const warnRoles = [
    ['1', config.role_warning_1],
    ['2', config.role_warning_2],
    ['3', config.role_warning_3],
  ].filter(([, id]) => id)

  for (const [n, roleId] of warnRoles) {
    if (!(newMember.roles.cache.has(roleId) && !oldMember.roles.cache.has(roleId))) continue
    const { data: sm } = await sb
      .from('staff_members')
      .select('id, display_name')
      .eq('discord_id', newMember.id)
      .maybeSingle()
    if (!sm) continue
    await sb.from('staff_reviews').insert({
      staff_member_id: sm.id,
      type: 'avertissement',
      status: 'acte',
      reason: `Rôle Discord « Avertissement ${n} » ajouté (détecté automatiquement).`,
    })
    console.log(`[warn] Avertissement ${n} noté pour ${sm.display_name}`)
  }
}

// ----------------------------------------------- Auto-ban (salon blacklist)
async function handleBlacklistMessage(msg) {
  if (!config.autoban_channel_id || msg.channelId !== config.autoban_channel_id) return
  if (msg.author?.bot) return
  const ids = [...msg.content.matchAll(/\b(\d{17,20})\b/g)].map((m) => m[1])
  if (ids.length === 0) return

  const guild = await getGuild()
  let banned = 0
  for (const id of new Set(ids)) {
    if (id === client.user.id || id === guild.ownerId) continue
    try {
      await guild.bans.create(id, { reason: BAN_REASON })
      banned++
      console.log(`[autoban] ${id} banni`)
    } catch (e) {
      console.error(`[autoban] échec ${id} : ${e.message}`)
    }
  }
  if (banned > 0) await msg.react('🔨').catch(() => {})
}

// ------------------------------------------------------------- Temps réel
function subscribeRealtime() {
  sb.channel('bot-staff-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_members' }, async (payload) => {
      await loadMappings()
      if (payload.eventType === 'INSERT') {
        await postPermRequest(payload.new, 'Nouveau recrutement')
        await syncMember(payload.new)
      } else if (payload.eventType === 'UPDATE') {
        if (permRelevantChange(payload.old, payload.new)) {
          await postPermRequest(payload.new, 'Changement de grade / permission')
        }
        await syncMember(payload.new)
      } else if (payload.eventType === 'DELETE') {
        await removeAllManaged(payload.old)
      }
    })
    .subscribe((status) => console.log(`[realtime] staff_members : ${status}`))
}

async function fullReconcile() {
  await loadMappings()
  const { data: all } = await sb.from('staff_members').select('*')
  for (const row of all ?? []) {
    if (['actif', 'suspendu'].includes(row.status)) await syncMember(row, { silent: true })
    else await removeAllManaged(row)
  }
  console.log(`[reconcile] ${all?.length ?? 0} membres vérifiés`)
}

// Maintien en éveil : écrit dans la base toutes les 72 h.
async function keepalive() {
  const { error } = await sb
    .from('keepalive')
    .update({ last_ping: new Date().toISOString() })
    .eq('id', 1)
  console.log(`[keepalive] ${error ? 'échec : ' + error.message : 'ok'}`)
}

// ------------------------------------------------------------------ Start
client.once(Events.ClientReady, async (c) => {
  console.log(`[bot] Connecté en tant que ${c.user.tag}`)
  await fullReconcile()
  subscribeRealtime()
  setInterval(fullReconcile, 10 * 60 * 1000)
  keepalive()
  setInterval(keepalive, 72 * 60 * 60 * 1000)
})

client.on(Events.GuildMemberUpdate, (o, n) =>
  handleMemberUpdate(o, n).catch((e) => console.error(`[warn] ${e.message}`))
)
client.on(Events.MessageCreate, (m) =>
  handleBlacklistMessage(m).catch((e) => console.error(`[autoban] ${e.message}`))
)

client.login(DISCORD_BOT_TOKEN)
