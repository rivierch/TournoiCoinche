import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Tournament, Team, Match, TournamentSummary, TournamentSettings } from '../types'
import { generatePoolMatches } from '../utils/drawEngine'
import { generateBracket } from '../utils/bracketGenerator'
import { calculateStandings } from '../utils/scoreCalculator'

interface TournamentState {
  tournaments: Record<string, Tournament>
  currentTournamentId: string | null
  isLoaded: boolean
}

interface TournamentActions {
  // Tournoi
  createTournament: (name: string) => Tournament
  loadTournament: (id: string) => Tournament | null
  saveTournament: (tournament: Tournament) => void
  deleteTournament: (id: string) => void
  setCurrentTournament: (id: string | null) => void
  getCurrentTournament: () => Tournament | null
  getTournamentList: () => TournamentSummary[]
  updateTournamentSettings: (settings: Partial<TournamentSettings>) => void
  
  // Équipes
  addTeam: (team: Omit<Team, 'id'>) => void
  updateTeam: (team: Team) => void
  removeTeam: (teamId: string) => void
  
  // Matchs
  updateMatchScore: (matchId: string, scoreTeam1: number, scoreTeam2: number, phase: 'pool' | 'final') => void
  
  // Phases
  startPoolPhase: () => void
  startFinalPhase: () => void
  completeTournament: () => void
  
  // Persistance
  loadFromStorage: () => Promise<void>
  saveToStorage: () => Promise<void>
}

type TournamentStore = TournamentState & TournamentActions

const DEFAULT_SETTINGS: TournamentSettings = {
  matchesPerTeam: 3,
  teamsQualifiedForFinals: 4,
  pointsForWin: 3,
  pointsForDraw: 1,
  pointsForLoss: 0,
  numberOfTables: 4,
  matchDurationMinutes: 30,
  startTime: '09:00',
}

export const useTournamentStore = create<TournamentStore>((set, get) => ({
  tournaments: {},
  currentTournamentId: null,
  isLoaded: false,

  createTournament: (name: string) => {
    const id = uuidv4()
    const now = new Date().toISOString()
    const tournament: Tournament = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      teams: [],
      pools: [{ id: uuidv4(), name: 'Poule Principale', teamIds: [] }],
      poolMatches: [],
      finalMatches: [],
      status: 'setup',
      settings: { ...DEFAULT_SETTINGS },
    }

    set((state) => ({
      tournaments: { ...state.tournaments, [id]: tournament },
      currentTournamentId: id,
    }))

    get().saveToStorage()
    return tournament
  },

  loadTournament: (id: string) => {
    const tournament = get().tournaments[id]
    if (tournament) {
      set({ currentTournamentId: id })
    }
    return tournament || null
  },

  saveTournament: (tournament: Tournament) => {
    set((state) => ({
      tournaments: {
        ...state.tournaments,
        [tournament.id]: {
          ...tournament,
          updatedAt: new Date().toISOString(),
        },
      },
    }))
    get().saveToStorage()
  },

  deleteTournament: (id: string) => {
    set((state) => {
      const { [id]: _, ...rest } = state.tournaments
      return {
        tournaments: rest,
        currentTournamentId: state.currentTournamentId === id ? null : state.currentTournamentId,
      }
    })
    get().saveToStorage()
  },

  setCurrentTournament: (id: string | null) => {
    set({ currentTournamentId: id })
  },

  getCurrentTournament: () => {
    const { tournaments, currentTournamentId } = get()
    return currentTournamentId ? tournaments[currentTournamentId] || null : null
  },

  getTournamentList: () => {
    return Object.values(get().tournaments).map((t) => ({
      id: t.id,
      name: t.name,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      status: t.status,
      teamCount: t.teams.length,
    }))
  },

  updateTournamentSettings: (settings: Partial<TournamentSettings>) => {
    const tournament = get().getCurrentTournament()
    if (!tournament) return

    const updatedTournament: Tournament = {
      ...tournament,
      settings: { ...tournament.settings, ...settings },
    }
    get().saveTournament(updatedTournament)
  },

  addTeam: (teamData: Omit<Team, 'id'>) => {
    const tournament = get().getCurrentTournament()
    if (!tournament) return

    const team: Team = {
      id: uuidv4(),
      ...teamData,
    }

    const updatedTournament: Tournament = {
      ...tournament,
      teams: [...tournament.teams, team],
      pools: tournament.pools.map((pool, index) =>
        index === 0 ? { ...pool, teamIds: [...pool.teamIds, team.id] } : pool
      ),
    }

    get().saveTournament(updatedTournament)
  },

  updateTeam: (team: Team) => {
    const tournament = get().getCurrentTournament()
    if (!tournament) return

    const updatedTournament: Tournament = {
      ...tournament,
      teams: tournament.teams.map((t) => (t.id === team.id ? team : t)),
    }

    get().saveTournament(updatedTournament)
  },

  removeTeam: (teamId: string) => {
    const tournament = get().getCurrentTournament()
    if (!tournament) return

    const updatedTournament: Tournament = {
      ...tournament,
      teams: tournament.teams.filter((t) => t.id !== teamId),
      pools: tournament.pools.map((pool) => ({
        ...pool,
        teamIds: pool.teamIds.filter((id) => id !== teamId),
      })),
    }

    get().saveTournament(updatedTournament)
  },

  updateMatchScore: (matchId: string, scoreTeam1: number, scoreTeam2: number, phase: 'pool' | 'final') => {
    const tournament = get().getCurrentTournament()
    if (!tournament) return

    const matchesKey = phase === 'pool' ? 'poolMatches' : 'finalMatches'
    const updatedMatches = tournament[matchesKey].map((match) =>
      match.id === matchId ? { ...match, scoreTeam1, scoreTeam2 } : match
    )

    let updatedTournament: Tournament = {
      ...tournament,
      [matchesKey]: updatedMatches,
    }

    // Si c'est un match de phase finale, mettre à jour les matchs suivants
    if (phase === 'final') {
      const match = updatedMatches.find((m) => m.id === matchId)
      if (match && match.scoreTeam1 !== null && match.scoreTeam2 !== null) {
        const winnerId = match.scoreTeam1 > match.scoreTeam2 ? match.team1Id : match.team2Id
        updatedTournament = updateBracketProgression(updatedTournament, match, winnerId)
      }
    }

    get().saveTournament(updatedTournament)
  },

  startPoolPhase: () => {
    const tournament = get().getCurrentTournament()
    if (!tournament || tournament.teams.length < 2) return

    const poolMatches = generatePoolMatches(
      tournament.teams,
      tournament.settings.matchesPerTeam,
      tournament.settings.numberOfTables
    )

    const updatedTournament: Tournament = {
      ...tournament,
      poolMatches,
      status: 'pool_phase',
    }

    get().saveTournament(updatedTournament)
  },

  startFinalPhase: () => {
    const tournament = get().getCurrentTournament()
    if (!tournament) return

    // Calculer le classement
    const standings = calculateStandings(
      tournament.teams,
      tournament.poolMatches,
      tournament.settings
    )

    // Prendre les X meilleures équipes
    const qualifiedTeams = standings
      .slice(0, tournament.settings.teamsQualifiedForFinals)
      .map((s) => s.team)

    // Générer le bracket
    const finalMatches = generateBracket(qualifiedTeams)

    const updatedTournament: Tournament = {
      ...tournament,
      finalMatches,
      status: 'final_phase',
    }

    get().saveTournament(updatedTournament)
  },

  completeTournament: () => {
    const tournament = get().getCurrentTournament()
    if (!tournament) return

    const updatedTournament: Tournament = {
      ...tournament,
      status: 'completed',
    }

    get().saveTournament(updatedTournament)
  },

  loadFromStorage: async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const data = await window.electronAPI.store.get('tournaments')
        if (data && typeof data === 'object') {
          set({ tournaments: data as Record<string, Tournament>, isLoaded: true })
        } else {
          set({ isLoaded: true })
        }
      } else {
        // Fallback pour le développement web
        const data = localStorage.getItem('tournaments')
        if (data) {
          set({ tournaments: JSON.parse(data), isLoaded: true })
        } else {
          set({ isLoaded: true })
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      set({ isLoaded: true })
    }
  },

  saveToStorage: async () => {
    try {
      const { tournaments } = get()
      if (typeof window !== 'undefined' && window.electronAPI) {
        await window.electronAPI.store.set('tournaments', tournaments)
      } else {
        // Fallback pour le développement web
        localStorage.setItem('tournaments', JSON.stringify(tournaments))
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  },
}))

// Fonction utilitaire pour mettre à jour la progression dans le bracket
function updateBracketProgression(
  tournament: Tournament,
  completedMatch: Match,
  winnerId: string
): Tournament {
  const { finalMatches } = tournament
  const bracketPosition = completedMatch.bracketPosition

  if (bracketPosition === undefined) return tournament

  // Déterminer le prochain match
  const nextPosition = Math.floor(bracketPosition / 2)
  const isFirstTeam = bracketPosition % 2 === 0

  const updatedMatches = finalMatches.map((match) => {
    if (match.bracketPosition === nextPosition && match.phase !== completedMatch.phase) {
      // Déterminer si c'est le bon match suivant (demi-finale -> finale, etc.)
      const nextPhase = getNextPhase(completedMatch.phase)
      if (match.phase === nextPhase) {
        return isFirstTeam
          ? { ...match, team1Id: winnerId }
          : { ...match, team2Id: winnerId }
      }
    }
    return match
  })

  return { ...tournament, finalMatches: updatedMatches }
}

function getNextPhase(currentPhase: Match['phase']): Match['phase'] | null {
  switch (currentPhase) {
    case 'quarterfinal':
      return 'semifinal'
    case 'semifinal':
      return 'final'
    default:
      return null
  }
}
