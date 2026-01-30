import { v4 as uuidv4 } from 'uuid'
import type { Team, Match, MatchPhase } from '../types'

/**
 * Génère un bracket d'élimination directe pour les équipes qualifiées
 */
export function generateBracket(qualifiedTeams: Team[]): Match[] {
  const numTeams = qualifiedTeams.length

  if (numTeams < 2) return []

  // Déterminer la taille du bracket (puissance de 2)
  const bracketSize = getNextPowerOfTwo(numTeams)
  const matches: Match[] = []

  // Nombre de byes nécessaires
  const numByes = bracketSize - numTeams

  // Réorganiser les équipes pour le seeding (1 vs dernier, 2 vs avant-dernier, etc.)
  const seededTeams = seedTeams(qualifiedTeams)

  // Générer les matchs du premier tour
  if (bracketSize === 2) {
    // Finale directe
    matches.push(createMatch(seededTeams[0]?.id || '', seededTeams[1]?.id || '', 'final', 0))
  } else if (bracketSize === 4) {
    // Demi-finales puis finale
    matches.push(createMatch(seededTeams[0]?.id || '', seededTeams[3]?.id || '', 'semifinal', 0))
    matches.push(createMatch(seededTeams[1]?.id || '', seededTeams[2]?.id || '', 'semifinal', 1))
    matches.push(createMatch('', '', 'final', 0))
    // Match pour la 3ème place (optionnel)
    matches.push(createMatch('', '', 'third_place', 0))
  } else if (bracketSize === 8) {
    // Quarts de finale
    const quarterPairings = [
      [0, 7], // 1 vs 8
      [3, 4], // 4 vs 5
      [1, 6], // 2 vs 7
      [2, 5], // 3 vs 6
    ]

    quarterPairings.forEach(([idx1, idx2], position) => {
      const team1 = seededTeams[idx1]?.id || ''
      const team2 = idx2 < seededTeams.length ? seededTeams[idx2]?.id || '' : ''
      matches.push(createMatch(team1, team2, 'quarterfinal', position))
    })

    // Demi-finales (vides, seront remplies par les vainqueurs)
    matches.push(createMatch('', '', 'semifinal', 0))
    matches.push(createMatch('', '', 'semifinal', 1))

    // Finale
    matches.push(createMatch('', '', 'final', 0))

    // Match pour la 3ème place
    matches.push(createMatch('', '', 'third_place', 0))
  } else {
    // Pour les brackets plus grands (16 équipes, etc.)
    // Générer récursivement
    return generateLargeBracket(seededTeams, bracketSize)
  }

  // Gérer les byes : si une équipe n'a pas d'adversaire, elle passe directement
  return handleByes(matches, seededTeams)
}

/**
 * Crée un objet Match
 */
function createMatch(
  team1Id: string,
  team2Id: string,
  phase: MatchPhase,
  bracketPosition: number
): Match {
  return {
    id: uuidv4(),
    team1Id,
    team2Id,
    scoreTeam1: null,
    scoreTeam2: null,
    phase,
    bracketPosition,
  }
}

/**
 * Retourne la prochaine puissance de 2 supérieure ou égale à n
 */
function getNextPowerOfTwo(n: number): number {
  if (n <= 2) return 2
  if (n <= 4) return 4
  if (n <= 8) return 8
  if (n <= 16) return 16
  return 32
}

/**
 * Organise les équipes selon le seeding standard
 * (1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6 pour 8 équipes)
 */
function seedTeams(teams: Team[]): Team[] {
  // Les équipes sont déjà triées par classement (la meilleure en premier)
  return [...teams]
}

/**
 * Gère les byes pour les équipes sans adversaire
 */
function handleByes(matches: Match[], teams: Team[]): Match[] {
  return matches.map((match) => {
    // Si un match du premier tour n'a qu'une équipe, c'est un bye
    if (match.phase === 'quarterfinal' || (match.phase === 'semifinal' && teams.length <= 4)) {
      if (match.team1Id && !match.team2Id) {
        // L'équipe 1 gagne par forfait, on met un score symbolique
        return { ...match, scoreTeam1: 1, scoreTeam2: 0 }
      }
      if (match.team2Id && !match.team1Id) {
        return { ...match, scoreTeam1: 0, scoreTeam2: 1 }
      }
    }
    return match
  })
}

/**
 * Génère un bracket pour 16 équipes ou plus
 */
function generateLargeBracket(teams: Team[], bracketSize: number): Match[] {
  const matches: Match[] = []
  const rounds = Math.log2(bracketSize)

  // Premier tour
  const firstRoundMatches = bracketSize / 2
  const firstRoundPhase: MatchPhase = rounds === 4 ? 'quarterfinal' : 'pool' // Utiliser pool comme placeholder

  for (let i = 0; i < firstRoundMatches; i++) {
    const team1Idx = i
    const team2Idx = bracketSize - 1 - i
    const team1 = teams[team1Idx]?.id || ''
    const team2 = team2Idx < teams.length ? teams[team2Idx]?.id || '' : ''
    matches.push(createMatch(team1, team2, firstRoundPhase, i))
  }

  // Tours suivants
  let currentRoundSize = firstRoundMatches / 2
  const phases: MatchPhase[] = ['quarterfinal', 'semifinal', 'final']
  let phaseIdx = 0

  while (currentRoundSize >= 1) {
    const phase = phases[phaseIdx] || 'final'
    for (let i = 0; i < currentRoundSize; i++) {
      matches.push(createMatch('', '', phase, i))
    }
    currentRoundSize /= 2
    phaseIdx++
  }

  // Ajouter le match pour la 3ème place
  matches.push(createMatch('', '', 'third_place', 0))

  return handleByes(matches, teams)
}

/**
 * Obtient le vainqueur d'un match
 */
export function getMatchWinner(match: Match): string | null {
  if (match.scoreTeam1 === null || match.scoreTeam2 === null) return null
  if (match.scoreTeam1 > match.scoreTeam2) return match.team1Id
  if (match.scoreTeam2 > match.scoreTeam1) return match.team2Id
  return null // Match nul (ne devrait pas arriver en phase finale)
}

/**
 * Obtient le perdant d'un match
 */
export function getMatchLoser(match: Match): string | null {
  if (match.scoreTeam1 === null || match.scoreTeam2 === null) return null
  if (match.scoreTeam1 > match.scoreTeam2) return match.team2Id
  if (match.scoreTeam2 > match.scoreTeam1) return match.team1Id
  return null
}

/**
 * Vérifie si le bracket est complet
 */
export function isBracketComplete(matches: Match[]): boolean {
  const finalMatch = matches.find((m) => m.phase === 'final')
  return finalMatch?.scoreTeam1 !== null && finalMatch?.scoreTeam2 !== null
}

/**
 * Obtient les résultats finaux du bracket
 */
export function getBracketResults(matches: Match[], teams: Team[]): {
  winner: Team | null
  runnerUp: Team | null
  thirdPlace: Team | null
} {
  const finalMatch = matches.find((m) => m.phase === 'final')
  const thirdPlaceMatch = matches.find((m) => m.phase === 'third_place')

  const winnerId = finalMatch ? getMatchWinner(finalMatch) : null
  const runnerUpId = finalMatch ? getMatchLoser(finalMatch) : null
  const thirdPlaceId = thirdPlaceMatch ? getMatchWinner(thirdPlaceMatch) : null

  return {
    winner: teams.find((t) => t.id === winnerId) || null,
    runnerUp: teams.find((t) => t.id === runnerUpId) || null,
    thirdPlace: teams.find((t) => t.id === thirdPlaceId) || null,
  }
}
