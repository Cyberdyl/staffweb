import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Shield } from 'lucide-react'
import { SERVER_NAME } from '../lib/config'

function LegalShell({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> Retour à l’accueil
      </Link>
      <div className="card p-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600/15 text-brand-300">
            {icon}
          </span>
          <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
        </div>
        <div className="space-y-4 text-sm leading-relaxed text-slate-300 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_li]:ml-4 [&_li]:list-disc">
          {children}
        </div>
        <p className="mt-8 text-xs text-slate-600">
          Dernière mise à jour : juin 2026.
        </p>
      </div>
    </div>
  )
}

export function Terms() {
  return (
    <LegalShell icon={<FileText className="h-6 w-6" />} title="Conditions d’utilisation">
      <p>
        Ce site est un outil interne de recrutement et de gestion du staff de la
        communauté FiveM <strong>{SERVER_NAME}</strong>. En l’utilisant, tu
        acceptes les conditions ci-dessous.
      </p>
      <h2>1. Objet</h2>
      <p>
        Le site permet de déposer une candidature pour rejoindre l’équipe staff,
        de suivre son traitement, et — pour les membres habilités — de gérer les
        candidatures, le calendrier d’entretiens et l’effectif staff.
      </p>
      <h2>2. Connexion</h2>
      <p>
        L’accès se fait via ton compte <strong>Discord</strong>. Tu es
        responsable de l’exactitude des informations que tu fournis dans ta
        candidature.
      </p>
      <h2>3. Comportement</h2>
      <ul>
        <li>Fournir des informations honnêtes et exactes.</li>
        <li>Ne pas tenter d’accéder à des fonctions réservées au staff.</li>
        <li>Respecter le règlement de la communauté {SERVER_NAME}.</li>
      </ul>
      <h2>4. Décisions de recrutement</h2>
      <p>
        L’acceptation ou le refus d’une candidature relève de la seule décision
        de l’équipe de direction de {SERVER_NAME}, sans obligation de
        justification.
      </p>
      <h2>5. Disponibilité</h2>
      <p>
        Le service est fourni « en l’état », sans garantie de disponibilité
        continue. Il peut évoluer ou être interrompu à tout moment.
      </p>
      <h2>6. Contact</h2>
      <p>
        Pour toute question, rapproche-toi de l’équipe de direction sur le
        Discord {SERVER_NAME}.
      </p>
    </LegalShell>
  )
}

export function Privacy() {
  return (
    <LegalShell icon={<Shield className="h-6 w-6" />} title="Politique de confidentialité">
      <p>
        Cette politique explique quelles données sont collectées par l’outil de
        recrutement de <strong>{SERVER_NAME}</strong> et comment elles sont
        utilisées.
      </p>
      <h2>1. Données collectées</h2>
      <ul>
        <li>
          <strong>Via Discord</strong> (à la connexion) : identifiant Discord,
          nom d’utilisateur, avatar et adresse e-mail associée.
        </li>
        <li>
          <strong>Via le formulaire</strong> : les réponses que tu saisis
          (prénom, pseudo, UUID en jeu, âge, disponibilités, expérience, etc.).
        </li>
        <li>
          <strong>Si tu rejoins le staff</strong> : grade, pôle, permissions,
          dates et notes internes de suivi.
        </li>
      </ul>
      <h2>2. Utilisation</h2>
      <p>
        Ces données servent uniquement à traiter les candidatures, organiser les
        entretiens et gérer l’équipe staff. Elles ne sont ni vendues, ni cédées à
        des tiers à des fins commerciales.
      </p>
      <h2>3. Hébergement</h2>
      <p>
        Les données sont stockées sur <strong>Supabase</strong> (base de
        données sécurisée). L’accès est restreint par des règles de sécurité :
        un candidat ne voit que sa propre candidature ; seuls les membres
        habilités accèdent aux données de gestion.
      </p>
      <h2>4. Conservation</h2>
      <p>
        Les candidatures non retenues peuvent être conservées le temps
        nécessaire au suivi du recrutement, puis supprimées sur demande.
      </p>
      <h2>5. Tes droits</h2>
      <p>
        Tu peux demander l’accès, la rectification ou la suppression de tes
        données en contactant l’équipe de direction sur le Discord{' '}
        {SERVER_NAME}.
      </p>
      <h2>6. Discord</h2>
      <p>
        La connexion s’appuie sur l’API Discord, soumise aux conditions et à la
        politique de confidentialité de Discord.
      </p>
    </LegalShell>
  )
}
