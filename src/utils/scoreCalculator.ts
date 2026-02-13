import type { Team, Match, TeamStanding, TournamentSettings } from '../types'

/**
 * Calcule le classement des équipes basé sur les matchs de poule
 */
export function calculateStandings(
  teams: Team[],
  matches: Match[],
  settings: TournamentSettings
): TeamStanding[] {
  // Initialiser les standings
  const standings: Record<string, TeamStanding> = {}

  teams.forEach((team) => {
    standings[team.id] = {
      teamId: team.id,
      team,
      played: 0,
      won: 0,
      lost: 0,
      drawn: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointsDiff: 0,
      score: 0,
    }
  })

  // Parcourir les matchs terminés
  matches.forEach((match) => {
    if (match.scoreTeam1 === null || match.scoreTeam2 === null) return
    if (!standings[match.team1Id] || !standings[match.team2Id]) return

    const team1Standing = standings[match.team1Id]
    const team2Standing = standings[match.team2Id]

    // Mettre à jour les matchs joués
    team1Standing.played++
    team2Standing.played++

    // Mettre à jour les points marqués/encaissés
    team1Standing.pointsFor += match.scoreTeam1
    team1Standing.pointsAgainst += match.scoreTeam2
    team2Standing.pointsFor += match.scoreTeam2
    team2Standing.pointsAgainst += match.scoreTeam1

    // Déterminer le résultat
    if (match.scoreTeam1 > match.scoreTeam2) {
      // Équipe 1 gagne
      team1Standing.won++
      team1Standing.score += settings.pointsForWin
      team2Standing.lost++
      team2Standing.score += settings.pointsForLoss
    } else if (match.scoreTeam2 > match.scoreTeam1) {
      // Équipe 2 gagne
      team2Standing.won++
      team2Standing.score += settings.pointsForWin
      team1Standing.lost++
      team1Standing.score += settings.pointsForLoss
    } else {
      // Match nul
      team1Standing.drawn++
      team2Standing.drawn++
      team1Standing.score += settings.pointsForDraw
      team2Standing.score += settings.pointsForDraw
    }
  })

  // Calculer la différence de points
  Object.values(standings).forEach((standing) => {
    standing.pointsDiff = standing.pointsFor - standing.pointsAgainst
  })

  // Trier par : 1) Score, 2) Différence de points, 3) Points marqués
  const sortedStandings = Object.values(standings).sort((a, b) => {
    // 1. Score (points de classement)
    if (b.score !== a.score) return b.score - a.score

    // 2. Différence de points
    if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff

    // 3. Points marqués
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor

    // 4. Confrontation directe (si égalité parfaite)
    return compareHeadToHead(a.teamId, b.teamId, matches)
  })

  return sortedStandings
}

/**
 * Calcule le nombre réel de matchs programmés par équipe (d'après le tirage)
 */
export function getTotalMatchesByTeam(matches: Match[]): Record<string, number> {
  const count: Record<string, number> = {}
  matches.forEach((match) => {
    count[match.team1Id] = (count[match.team1Id] ?? 0) + 1
    count[match.team2Id] = (count[match.team2Id] ?? 0) + 1
  })
  return count
}

/**
 * Compare deux équipes par leurs confrontations directes
 */
function compareHeadToHead(team1Id: string, team2Id: string, matches: Match[]): number {
  const directMatches = matches.filter(
    (m) =>
      (m.team1Id === team1Id && m.team2Id === team2Id) ||
      (m.team1Id === team2Id && m.team2Id === team1Id)
  )

  let team1Wins = 0
  let team2Wins = 0

  directMatches.forEach((match) => {
    if (match.scoreTeam1 === null || match.scoreTeam2 === null) return

    if (match.team1Id === team1Id) {
      if (match.scoreTeam1 > match.scoreTeam2) team1Wins++
      else if (match.scoreTeam2 > match.scoreTeam1) team2Wins++
    } else {
      if (match.scoreTeam2 > match.scoreTeam1) team1Wins++
      else if (match.scoreTeam1 > match.scoreTeam2) team2Wins++
    }
  })

  return team2Wins - team1Wins
}

/**
 * Calcule les statistiques d'un match
 */
export function getMatchStats(match: Match): {
  isComplete: boolean
  winner: string | null
  loser: string | null
  isDraw: boolean
  scoreDiff: number
} {
  const isComplete = match.scoreTeam1 !== null && match.scoreTeam2 !== null

  if (!isComplete) {
    return {
      isComplete: false,
      winner: null,
      loser: null,
      isDraw: false,
      scoreDiff: 0,
    }
  }

  const score1 = match.scoreTeam1!
  const score2 = match.scoreTeam2!
  const isDraw = score1 === score2

  return {
    isComplete: true,
    winner: isDraw ? null : score1 > score2 ? match.team1Id : match.team2Id,
    loser: isDraw ? null : score1 > score2 ? match.team2Id : match.team1Id,
    isDraw,
    scoreDiff: Math.abs(score1 - score2),
  }
}

/**
 * Calcule le pourcentage de matchs terminés
 */
export function getPoolProgress(matches: Match[]): {
  completed: number
  total: number
  percentage: number
} {
  const total = matches.length
  const completed = matches.filter(
    (m) => m.scoreTeam1 !== null && m.scoreTeam2 !== null
  ).length

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

/**
 * Vérifie si la phase de poules est terminée
 */
export function isPoolPhaseComplete(matches: Match[]): boolean {
  return matches.every((m) => m.scoreTeam1 !== null && m.scoreTeam2 !== null)
}

/**
 * Obtient les équipes qualifiées pour la phase finale
 */
export function getQualifiedTeams(
  teams: Team[],
  matches: Match[],
  settings: TournamentSettings
): Team[] {
  const standings = calculateStandings(teams, matches, settings)
  return standings.slice(0, settings.teamsQualifiedForFinals).map((s) => s.team)
}

/**
 * Formate un score pour l'affichage
 */
export function formatScore(score: number | null): string {
  return score !== null ? score.toString() : '-'
}

/**
 * Calcule les statistiques globales du tournoi
 */
export function getTournamentStats(matches: Match[]): {
  totalMatches: number
  completedMatches: number
  totalPointsScored: number
  averagePointsPerMatch: number
  highestScore: number
  lowestScore: number
} {
  const completedMatches = matches.filter(
    (m) => m.scoreTeam1 !== null && m.scoreTeam2 !== null
  )

  const allScores = completedMatches.flatMap((m) => [m.scoreTeam1!, m.scoreTeam2!])
  const totalPoints = allScores.reduce((sum, score) => sum + score, 0)

  return {
    totalMatches: matches.length,
    completedMatches: completedMatches.length,
    totalPointsScored: totalPoints,
    averagePointsPerMatch:
      completedMatches.length > 0
        ? Math.round(totalPoints / (completedMatches.length * 2))
        : 0,
    highestScore: allScores.length > 0 ? Math.max(...allScores) : 0,
    lowestScore: allScores.length > 0 ? Math.min(...allScores) : 0,
  }
}
