// Types TypeScript reflétant le schéma de la base Supabase.

export type AppRole = 'applicant' | 'manager' | 'owner'

export type ApplicationStatus = 'en_attente' | 'entretien' | 'accepte' | 'refuse'

export type StaffStatus = 'actif' | 'suspendu' | 'parti' | 'vire'

export type ReviewType =
  | 'avertissement'
  | 'up'
  | 'down'
  | 'vire'
  | 'note'
  | 'reset_perm'

export type ReviewStatus = 'a_traiter' | 'acte' | 'annule'

export interface Profile {
  id: string
  discord_id: string | null
  username: string | null
  avatar_url: string | null
  email: string | null
  role: AppRole
  created_at: string
}

export interface Application {
  id: string
  user_id: string
  // --- Formulaire BlueStark FA ---
  first_name: string | null
  pseudo: string | null
  discord_user_id: string | null
  age: number | null
  has_mic: boolean | null
  discovery: string | null
  fivem_since: string | null
  server_since: string | null
  playtime: string | null
  sanctioned: boolean | null
  sanctioned_reason: string | null
  was_staff: boolean | null
  staff_servers: string | null
  staff_role: string | null
  motivation: string | null
  qualities: string | null
  scenario: string | null
  why_you: string | null
  contribution: string | null
  hours_per_week: string | null
  availability: string | null
  rules_accepted: boolean | null
  extra: string | null
  status: ApplicationStatus
  reviewed_by: string | null
  review_note: string | null
  created_at: string
  updated_at: string
  // jointures
  profile?: Profile | null
  reviewer?: Profile | null
}

export interface Appointment {
  id: string
  application_id: string | null
  manager_id: string | null
  title: string | null
  scheduled_at: string
  duration_min: number
  note: string | null
  created_by: string | null
  created_at: string
  // jointures
  manager?: Profile | null
  application?: Application | null
}

export interface IgPermission {
  id: string
  label: string
  color: string
  rank: number
}

export interface Grade {
  id: string
  label: string
  short: string | null
  category: 'fondation' | 'gestion' | 'staff'
  rank: number
  default_permission_id: string | null
  has_pole: boolean
  note: string | null
  color: string | null
  // jointures
  default_permission?: IgPermission | null
}

export interface StaffMember {
  id: string
  unique_id: string
  display_name: string
  discord_id: string | null
  profile_id: string | null
  grade_id: string | null
  pole: string | null
  permission_id: string | null
  perm_authorized: boolean
  status: StaffStatus
  notes: string | null
  staff_since: string | null
  last_up_at: string | null
  added_by: string | null
  created_at: string
  updated_at: string
  // jointures
  grade?: Grade | null
  permission?: IgPermission | null
  // calculé côté client
  warnings?: number
}

export interface StaffReview {
  id: string
  staff_member_id: string
  type: ReviewType
  reason: string | null
  status: ReviewStatus
  created_by: string | null
  created_at: string
  resolved_by: string | null
  resolved_at: string | null
  // jointures
  staff_member?: StaffMember | null
  author?: Profile | null
}
