// Types pour l'application de tournoi de coinche

// Déclaration pour l'API Electron (optionnelle en mode web)
declare global {
  interface Window {
    electronAPI?: {
      store: {
        get: (key: string) => Promise<unknown>
        set: (key: string, value: unknown) => Promise<void>
      }
    }
  }
}

export interface Player {
  name: string
}

export interface Team {
  id: string
  name: string
  player1: string
  player2: string
}

export type MatchPhase = 'pool' | 'quarterfinal' | 'semifinal' | 'final' | 'third_place'

export interface Match {
  id: string
  team1Id: string
  team2Id: string
  scoreTeam1: number | null
  scoreTeam2: number | null
  phase: MatchPhase
  poolId?: string
  roundNumber?: number // Pour les matchs de poule
  bracketPosition?: number // Position dans le bracket (pour la phase finale)
  tableNumber?: number // Numéro de la table assignée
  timeSlot?: number // Numéro du créneau horaire (0, 1, 2, ...)
}

export interface Pool {
  id: string
  name: string
  teamIds: string[]
}

export interface TeamStanding {
  teamId: string
  team: Team
  played: number
  won: number
  lost: number
  drawn: number
  pointsFor: number
  pointsAgainst: number
  pointsDiff: number
  score: number // Points de classement (3 pour victoire, 1 pour nul, 0 pour défaite)
}

export type TournamentStatus = 'setup' | 'pool_phase' | 'final_phase' | 'completed'

export interface TournamentSettings {
  matchesPerTeam: number
  teamsQualifiedForFinals: number
  /** Si true, le tournoi se termine après la phase de poules (uniquement matchs à la mêlée) */
  noFinalPhase?: boolean
  pointsForWin: number
  pointsForDraw: number
  pointsForLoss: number
  numberOfTables: number // Nombre de tables disponibles
  matchDurationMinutes: number // Durée d'un match en minutes
  startTime?: string // Heure de début du tournoi (format HH:mm)
}

export interface Tournament {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  teams: Team[]
  pools: Pool[]
  poolMatches: Match[]
  finalMatches: Match[]
  status: TournamentStatus
  settings: TournamentSettings
}

export interface TournamentSummary {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  status: TournamentStatus
  teamCount: number
}

// Types pour le store
export interface TournamentStore {
  tournaments: Record<string, Tournament>
  currentTournamentId: string | null
  
  // Actions
  createTournament: (name: string) => Tournament
  loadTournament: (id: string) => Tournament | null
  saveTournament: (tournament: Tournament) => void
  deleteTournament: (id: string) => void
  setCurrentTournament: (id: string | null) => void
  getCurrentTournament: () => Tournament | null
  getTournamentList: () => TournamentSummary[]
  
  // Équipes
  addTeam: (team: Omit<Team, 'id'>) => void
  updateTeam: (team: Team) => void
  removeTeam: (teamId: string) => void
  
  // Matchs
  updateMatchScore: (matchId: string, scoreTeam1: number, scoreTeam2: number) => void
  
  // Phases
  startPoolPhase: () => void
  startFinalPhase: () => void
  completeTournament: () => void
  
  // Persistance
  loadFromStorage: () => Promise<void>
  saveToStorage: () => Promise<void>
}

// Types utilitaires
export type CreateTeamInput = Omit<Team, 'id'>
export type CreateMatchInput = Omit<Match, 'id'>
