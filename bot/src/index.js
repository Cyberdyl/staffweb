// ============================================================================
//  Bot Discord BlueStark — synchronisation staff <-> Discord
//
//  Site -> Discord :
//   - À chaque ajout/modif/suppression dans l'effectif (table staff_members),
//     le bot attribue/retire les rôles : Staff de base + grade + pôle + perm IG
//     (la perm seulement si "autorisé à jouer la perm").
//   - ⛔ Si le membre a le rôle "Blacklisté Staff", AUCUN rôle n'est attribué
//     et une note automatique est ajoutée à son dossier.
//   - À chaque recrutement (INSERT), annonce dans le salon configuré :
//     UUID + @mention + grade + perm couleur.
//
//  Discord -> Site :
//   - Si un rôle "Avertissement 1/2/3" est ajouté à un membre du staff sur
//     Discord, une note d'avertissement automatique est créée sur son dossier.
//
//  Le bot ne touche QUE les rôles qu'il connaît (mappés dans la base) :
//  il ne retire jamais un rôle hors de son périmètre.
// ============================================================================
import 'dotenv/config'
import { Client, GatewayIntentBits, EmbedBuilder, Events } from 'discord.js'
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

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
})

// ---------------------------------------------------------------- Mappings
let grades = new Map() // id -> { label, short, discord_role_id, ... }
let perms = new Map() // id -> { label, color, discord_role_id, ... }
let config = {} // app_config key -> value

async function loadMappings() {
  const [g, p, c] = await Promise.all([
    sb.from('grades').select('*'),
    sb.from('ig_permissions').select('*'),
    sb.from('app_config').select('*'),
  ])
  grades = new Map((g.data ?? []).map((x) => [x.id, x]))
  perms = new Map((p.data ?? []).map((x) => [x.id, x]))
  config = Object.fromEntries((c.data ?? []).map((x) => [x.key, x.value]))
  console.log(
    `[mappings] ${grades.size} grades, ${perms.size} perms, config ok`
  )
}

// Tous les rôles que le bot a le droit de gérer (et seulement ceux-là).
function managedRoleIds() {
  const ids = new Set()
  for (const g of grades.values()) if (g.discord_role_id) ids.add(g.discord_role_id)
  for (const p of perms.values()) if (p.discord_role_id) ids.add(p.discord_role_id)
  for (const k of ['role_staff_base', 'role_pole_L', 'role_pole_I', 'role_pole_E']) {
    if (config[k]) ids.add(config[k])
  }
  return ids
}

// Rôles attendus pour une ligne de l'effectif.
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
    if (!silent) console.log(`[sync] ${row?.display_name ?? '?'} : pas de Discord ID, ignoré`)
    return
  }
  const member = await fetchMember(row.discord_id)
  if (!member) {
    if (!silent) console.log(`[sync] ${row.display_name} (${row.discord_id}) : pas sur le serveur`)
    return
  }

  // ⛔ Blacklisté Staff : on n'attribue RIEN.
  if (config.role_blacklist && member.roles.cache.has(config.role_blacklist)) {
    console.log(`[sync] ⛔ ${row.display_name} est Blacklisté Staff : rôles non attribués`)
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
  const toRemove = [...managed].filter(
    (r) => member.roles.cache.has(r) && !desired.has(r)
  )

  for (const r of toAdd) {
    await member.roles.add(r).then(
      () => console.log(`[sync] + rôle ${r} -> ${row.display_name}`),
      (e) => console.error(`[sync] échec ajout ${r} -> ${row.display_name} : ${e.message}`)
    )
  }
  for (const r of toRemove) {
    await member.roles.remove(r).then(
      () => console.log(`[sync] - rôle ${r} -> ${row.display_name}`),
      (e) => console.error(`[sync] échec retrait ${r} -> ${row.display_name} : ${e.message}`)
    )
  }
}

// Retire tous les rôles gérés (départ / suppression de l'effectif).
async function removeAllManaged(row) {
  if (!row?.discord_id) return
  const member = await fetchMember(row.discord_id)
  if (!member) return
  for (const r of managedRoleIds()) {
    if (member.roles.cache.has(r)) {
      await member.roles.remove(r).catch((e) =>
        console.error(`[sync] échec retrait ${r} : ${e.message}`)
      )
    }
  }
  console.log(`[sync] rôles staff retirés pour ${row.display_name}`)
}

// --------------------------------------------------- Annonce de recrutement
async function announceRecruit(row) {
  if (!config.announce_channel_id) return
  try {
    const channel = await client.channels.fetch(config.announce_channel_id)
    const g = row.grade_id ? grades.get(row.grade_id) : null
    const p = row.permission_id ? perms.get(row.permission_id) : null
    const color = p?.color ?? g?.color ?? '#3385ff'

    const embed = new EmbedBuilder()
      .setTitle('🎉 Nouveau membre du staff !')
      .setDescription(
        [
          `**UUID :** \`${row.unique_id}\``,
          row.discord_id ? `**Membre :** <@${row.discord_id}>` : null,
          `**Grade :** ${g ? g.label + (g.short ? ` (${g.short})` : '') : '—'}`,
          `**Perm IG :** ${p ? p.label : 'Aucune'}${
            p ? (row.perm_authorized ? ' ✅ autorisée' : ' 🔒 non autorisée') : ''
          }`,
        ]
          .filter(Boolean)
          .join('\n')
      )
      .setColor(color)
      .setFooter({ text: 'BlueStark — Recrutement staff' })
      .setTimestamp()

    await channel.send({
      content: row.discord_id ? `<@${row.discord_id}>` : undefined,
      embeds: [embed],
    })
    console.log(`[annonce] recrutement de ${row.display_name} publié`)
  } catch (e) {
    console.error(`[annonce] échec : ${e.message}`)
  }
}

// ------------------------------------------- Avertissements Discord -> site
async function handleMemberUpdate(oldMember, newMember) {
  const warnRoles = [
    ['1', config.role_warning_1],
    ['2', config.role_warning_2],
    ['3', config.role_warning_3],
  ].filter(([, id]) => id)

  for (const [n, roleId] of warnRoles) {
    const added =
      newMember.roles.cache.has(roleId) && !oldMember.roles.cache.has(roleId)
    if (!added) continue
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
      reason: `Rôle Discord « Avertissement ${n} » ajouté (détecté automatiquement par le bot).`,
    })
    console.log(`[warn] Avertissement ${n} noté pour ${sm.display_name}`)
  }
}

// ------------------------------------------------------------- Temps réel
function subscribeRealtime() {
  sb.channel('bot-staff-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'staff_members' },
      async (payload) => {
        await loadMappings() // au cas où grades/perms/config ont changé
        if (payload.eventType === 'INSERT') {
          await announceRecruit(payload.new)
          await syncMember(payload.new)
        } else if (payload.eventType === 'UPDATE') {
          await syncMember(payload.new)
        } else if (payload.eventType === 'DELETE') {
          await removeAllManaged(payload.old)
        }
      }
    )
    .subscribe((status) => console.log(`[realtime] staff_members : ${status}`))
}

// Resynchronise tout l'effectif (au démarrage puis périodiquement).
async function fullReconcile() {
  await loadMappings()
  const { data: all } = await sb.from('staff_members').select('*')
  console.log(`[reconcile] ${all?.length ?? 0} membres de l'effectif à vérifier`)
  for (const row of all ?? []) {
    if (['actif', 'suspendu'].includes(row.status)) {
      await syncMember(row, { silent: true })
    } else {
      await removeAllManaged(row)
    }
  }
  console.log('[reconcile] terminé')
}

// ------------------------------------------------------------------ Start
client.once(Events.ClientReady, async (c) => {
  console.log(`[bot] Connecté en tant que ${c.user.tag}`)
  await fullReconcile()
  subscribeRealtime()
  // Filet de sécurité : resync complet toutes les 10 minutes.
  setInterval(fullReconcile, 10 * 60 * 1000)
})

client.on(Events.GuildMemberUpdate, (oldM, newM) => {
  handleMemberUpdate(oldM, newM).catch((e) =>
    console.error(`[warn] erreur : ${e.message}`)
  )
})

client.login(DISCORD_BOT_TOKEN)
