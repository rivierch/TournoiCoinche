import { v4 as uuidv4 } from 'uuid'
import type { Team, Match } from '../types'
import { assignTablesAndSlots } from './scheduleEngine'

/**
 * Génère les matchs de la phase de poules avec tirage aléatoire
 * Chaque équipe joue un nombre fixe de matchs contre des adversaires différents
 */
export function generatePoolMatches(
  teams: Team[],
  matchesPerTeam: number,
  numberOfTables: number = 4
): Match[] {
  if (teams.length < 2) return []

  // Créer toutes les combinaisons possibles de matchs
  const allPossibleMatches: Array<[string, string]> = []
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      allPossibleMatches.push([teams[i].id, teams[j].id])
    }
  }

  // Mélanger les matchs possibles
  shuffleArray(allPossibleMatches)

  // Compteur de matchs par équipe
  const matchCount: Record<string, number> = {}
  teams.forEach((team) => {
    matchCount[team.id] = 0
  })

  // Sélectionner les matchs
  const selectedMatches: Array<[string, string]> = []
  const maxMatches = Math.min(matchesPerTeam, teams.length - 1)

  // Première passe : essayer de donner à chaque équipe le nombre de matchs demandé
  for (const [team1Id, team2Id] of allPossibleMatches) {
    if (matchCount[team1Id] < maxMatches && matchCount[team2Id] < maxMatches) {
      selectedMatches.push([team1Id, team2Id])
      matchCount[team1Id]++
      matchCount[team2Id]++
    }
  }

  // Deuxième passe : si certaines équipes n'ont pas assez de matchs, essayer d'en ajouter
  for (const [team1Id, team2Id] of allPossibleMatches) {
    const alreadySelected = selectedMatches.some(
      ([t1, t2]) => (t1 === team1Id && t2 === team2Id) || (t1 === team2Id && t2 === team1Id)
    )
    
    if (!alreadySelected) {
      const team1NeedsMore = matchCount[team1Id] < maxMatches
      const team2NeedsMore = matchCount[team2Id] < maxMatches
      
      if (team1NeedsMore || team2NeedsMore) {
        // Permettre un match supplémentaire même si une équipe a déjà son quota
        // pour équilibrer le nombre de matchs
        const team1CanPlay = matchCount[team1Id] < maxMatches + 1
        const team2CanPlay = matchCount[team2Id] < maxMatches + 1
        
        if (team1CanPlay && team2CanPlay && (team1NeedsMore || team2NeedsMore)) {
          selectedMatches.push([team1Id, team2Id])
          matchCount[team1Id]++
          matchCount[team2Id]++
        }
      }
    }
  }

  // Mélanger l'ordre des matchs sélectionnés pour l'affichage
  shuffleArray(selectedMatches)

  // Créer les objets Match
  const matches: Match[] = selectedMatches.map(([team1Id, team2Id]) => ({
    id: uuidv4(),
    team1Id,
    team2Id,
    scoreTeam1: null,
    scoreTeam2: null,
    phase: 'pool' as const,
  }))

  // Assigner les tables et les créneaux horaires
  return assignTablesAndSlots(matches, teams, numberOfTables)
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
