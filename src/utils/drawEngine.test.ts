import { describe, it, expect } from 'vitest'
import { generatePoolMatches } from './drawEngine'
import type { Team } from '../types'

function makeTeam(id: string, name: string): Team {
  return {
    id,
    name,
    player1: `${name}-P1`,
    player2: `${name}-P2`,
  }
}

function countMatchesPerTeam(matches: { team1Id: string; team2Id: string }[]): Record<string, number> {
  const count: Record<string, number> = {}
  for (const m of matches) {
    count[m.team1Id] = (count[m.team1Id] ?? 0) + 1
    count[m.team2Id] = (count[m.team2Id] ?? 0) + 1
  }
  return count
}

describe('generatePoolMatches', () => {
  it('chaque équipe joue exactement 6 matchs pour 10 équipes, 6 matchs/équipe, 3 tables', () => {
    const teams: Team[] = Array.from({ length: 10 }, (_, i) =>
      makeTeam(`t${i + 1}`, `Team ${i + 1}`)
    )

    const matches = generatePoolMatches(teams, 6, 3)

    const matchesPerTeam = countMatchesPerTeam(matches)

    for (const team of teams) {
      expect(matchesPerTeam[team.id], `${team.name} doit jouer exactement 6 matchs`).toBe(6)
    }
  })
})
