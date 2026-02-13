import { v4 as uuidv4 } from 'uuid'
import type { Team, Match } from '../types'

/**
 * Génère les matchs de la phase de poules avec tirage aléatoire.
 * Phase 1 : choisit exactement les paires (chaque équipe joue matchesPerTeam fois).
 * Phase 2 : répartit ces matchs dans les créneaux sans qu'une équipe joue deux fois au même créneau.
 */
export function generatePoolMatches(
  teams: Team[],
  matchesPerTeam: number,
  numberOfTables: number = 4
): Match[] {
  if (teams.length < 2) return []

  const teamIds = teams.map((t) => t.id)
  const totalMatches = (teams.length * matchesPerTeam) / 2
  const maxMatchesPerSlot = Math.min(numberOfTables, Math.floor(teams.length / 2))

  // Phase 1 : générer exactement totalMatches paires (chaque équipe dans exactement matchesPerTeam matchs)
  const pairs = pickMatchesWithExactQuota(teamIds, matchesPerTeam, totalMatches)
  if (pairs.length === 0) return []

  // Phase 2 : assigner chaque match à un créneau (et une table)
  const schedule = assignMatchesToSlots(pairs, maxMatchesPerSlot)

  // Créer les objets Match
  const matches: Match[] = schedule.map(({ team1Id, team2Id, slot, tableNumber }) => ({
    id: uuidv4(),
    team1Id,
    team2Id,
    scoreTeam1: null,
    scoreTeam2: null,
    phase: 'pool' as const,
    timeSlot: slot,
    tableNumber,
  }))

  matches.sort((a, b) => {
    if ((a.timeSlot ?? 0) !== (b.timeSlot ?? 0)) {
      return (a.timeSlot ?? 0) - (b.timeSlot ?? 0)
    }
    return (a.tableNumber ?? 0) - (b.tableNumber ?? 0)
  })

  return matches
}

/**
 * Génère un ensemble de paires (t1, t2) tel que chaque équipe apparaît exactement matchesPerTeam fois.
 * On part de toutes les paires possibles, on mélange, et on accepte une paire si les deux équipes
 * sont encore sous leur quota, jusqu'à avoir totalMatches paires.
 */
function pickMatchesWithExactQuota(
  teamIds: string[],
  matchesPerTeam: number,
  totalMatches: number
): Array<[string, string]> {
  const allPairs: Array<[string, string]> = []
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      allPairs.push([teamIds[i], teamIds[j]])
    }
  }
  const pairKey = (a: string, b: string) => (a < b ? `${a}-${b}` : `${b}-${a}`)
  const maxAttempts = 2000
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    shuffleArray(allPairs)
    const count: Record<string, number> = {}
    teamIds.forEach((id) => { count[id] = 0 })
    const chosen: Array<[string, string]> = []
    const used = new Set<string>()
    for (const [t1, t2] of allPairs) {
      if (chosen.length >= totalMatches) break
      if (count[t1]! >= matchesPerTeam || count[t2]! >= matchesPerTeam) continue
      const key = pairKey(t1, t2)
      if (used.has(key)) continue
      used.add(key)
      chosen.push([t1, t2])
      count[t1]!++
      count[t2]!++
    }
    if (chosen.length === totalMatches) return chosen
  }
  return []
}

/**
 * Assigne chaque paire à un créneau et un numéro de table, sans qu'une équipe joue deux fois au même créneau.
 */
function assignMatchesToSlots(
  pairs: Array<[string, string]>,
  maxMatchesPerSlot: number
): Array<{ team1Id: string; team2Id: string; slot: number; tableNumber: number }> {
  const teamsInSlot: Record<number, Set<string>> = {}
  const matchesInSlot: Record<number, number> = {}

  const result: Array<{ team1Id: string; team2Id: string; slot: number; tableNumber: number }> = []

  for (const [t1, t2] of pairs) {
    let slot = 0
    while (true) {
      if (!teamsInSlot[slot]) {
        teamsInSlot[slot] = new Set()
        matchesInSlot[slot] = 0
      }
      const count = matchesInSlot[slot]
      const busy = teamsInSlot[slot]
      if (count < maxMatchesPerSlot && !busy.has(t1) && !busy.has(t2)) {
        matchesInSlot[slot] = count + 1
        busy.add(t1)
        busy.add(t2)
        const tableNumber = count + 1
        result.push({ team1Id: t1, team2Id: t2, slot, tableNumber })
        break
      }
      slot++
    }
  }

  return result
}

/**
 * Mélange un tableau en place (Fisher-Yates shuffle)
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

/**
 * Vérifie si le tirage est valide (chaque équipe a au moins un match)
 */
export function validateDraw(teams: Team[], matches: Match[]): boolean {
  const teamMatchCount: Record<string, number> = {}
  teams.forEach((team) => {
    teamMatchCount[team.id] = 0
  })

  matches.forEach((match) => {
    teamMatchCount[match.team1Id]++
    teamMatchCount[match.team2Id]++
  })

  return Object.values(teamMatchCount).every((count) => count >= 1)
}

/**
 * Régénère le tirage pour une équipe spécifique
 * (utile si on veut remplacer les adversaires d'une équipe)
 */
export function regenerateMatchesForTeam(
  teamId: string,
  teams: Team[],
  existingMatches: Match[],
  matchesPerTeam: number
): Match[] {
  // Supprimer les matchs existants de cette équipe
  const otherMatches = existingMatches.filter(
    (m) => m.team1Id !== teamId && m.team2Id !== teamId
  )

  // Trouver les adversaires possibles
  const possibleOpponents = teams.filter((t) => t.id !== teamId)
  shuffleArray(possibleOpponents)

  // Générer de nouveaux matchs
  const newMatches: Match[] = []
  const maxNewMatches = Math.min(matchesPerTeam, possibleOpponents.length)

  for (let i = 0; i < maxNewMatches; i++) {
    newMatches.push({
      id: uuidv4(),
      team1Id: teamId,
      team2Id: possibleOpponents[i].id,
      scoreTeam1: null,
      scoreTeam2: null,
      phase: 'pool',
      roundNumber: i + 1,
    })
  }

  return [...otherMatches, ...newMatches]
}
