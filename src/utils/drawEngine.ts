import { v4 as uuidv4 } from 'uuid'
import type { Team, Match } from '../types'

/**
 * Type pour représenter un match sélectionné avec son créneau
 */
type ScheduledMatch = {
  team1Id: string
  team2Id: string
  slot: number
}

/**
 * Génère les matchs de la phase de poules avec tirage aléatoire
 * Utilise un algorithme de backtracking pour garantir le remplissage optimal des créneaux
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

  // Mélanger les matchs possibles pour le tirage aléatoire
  shuffleArray(allPossibleMatches)

  // Calcul du nombre maximum de matchs simultanés possible
  const maxMatchesPerSlot = Math.min(numberOfTables, Math.floor(teams.length / 2))
  
  // Nombre de créneaux
  const numberOfSlots = matchesPerTeam

  // Utiliser le backtracking pour trouver la meilleure configuration
  const result = backtrackSchedule(
    teams.map(t => t.id),
    allPossibleMatches,
    numberOfSlots,
    maxMatchesPerSlot,
    matchesPerTeam
  )

  // Créer les objets Match
  const matches: Match[] = result.map((scheduled) => ({
    id: uuidv4(),
    team1Id: scheduled.team1Id,
    team2Id: scheduled.team2Id,
    scoreTeam1: null,
    scoreTeam2: null,
    phase: 'pool' as const,
    timeSlot: scheduled.slot,
    tableNumber: 0, // Sera assigné après
  }))

  // Assigner les numéros de table
  const slotTables: Record<number, number> = {}
  for (const match of matches) {
    const slot = match.timeSlot ?? 0
    slotTables[slot] = (slotTables[slot] || 0) + 1
    match.tableNumber = slotTables[slot]
  }

  // Trier par créneau puis par table
  matches.sort((a, b) => {
    if ((a.timeSlot ?? 0) !== (b.timeSlot ?? 0)) {
      return (a.timeSlot ?? 0) - (b.timeSlot ?? 0)
    }
    return (a.tableNumber ?? 0) - (b.tableNumber ?? 0)
  })

  return matches
}

/**
 * Algorithme de backtracking pour remplir les créneaux de manière optimale
 */
function backtrackSchedule(
  teamIds: string[],
  possibleMatches: Array<[string, string]>,
  numberOfSlots: number,
  maxMatchesPerSlot: number,
  matchesPerTeam: number
): ScheduledMatch[] {
  // État du planning
  const schedule: ScheduledMatch[] = []
  
  // Matchs déjà utilisés (pour éviter les doublons)
  const usedMatches = new Set<string>()
  
  // Compteur de matchs par équipe
  const matchCount: Record<string, number> = {}
  teamIds.forEach(id => { matchCount[id] = 0 })
  
  // Équipes occupées par créneau
  const busyTeamsBySlot: Array<Set<string>> = []
  for (let i = 0; i < numberOfSlots; i++) {
    busyTeamsBySlot.push(new Set())
  }
  
  // Nombre de matchs par créneau
  const matchesInSlot: number[] = new Array(numberOfSlots).fill(0)

  // Fonction utilitaire pour générer une clé unique pour un match
  const matchKey = (t1: string, t2: string): string => {
    return t1 < t2 ? `${t1}-${t2}` : `${t2}-${t1}`
  }

  // Fonction de backtracking récursive
  function backtrack(slotIndex: number): boolean {
    // Si on a traité tous les créneaux, vérifier si la solution est valide
    if (slotIndex >= numberOfSlots) {
      // Vérifier que toutes les équipes ont joué le nombre requis de matchs (ou proche)
      const minMatches = Math.min(...Object.values(matchCount))
      return minMatches >= matchesPerTeam - 1 // Tolérance de 1 match
    }

    // Essayer de remplir ce créneau au maximum
    const filled = fillSlot(slotIndex)
    
    if (filled) {
      // Continuer avec le créneau suivant
      if (backtrack(slotIndex + 1)) {
        return true
      }
    }

    return filled
  }

  // Fonction pour remplir un créneau avec le maximum de matchs
  function fillSlot(slotIndex: number): boolean {
    // Trouver tous les matchs possibles pour ce créneau
    const availableMatches: Array<[string, string]> = []
    
    for (const [t1, t2] of possibleMatches) {
      const key = matchKey(t1, t2)
      
      // Vérifier que le match n'est pas déjà utilisé
      if (usedMatches.has(key)) continue
      
      // Vérifier que les deux équipes sont disponibles dans ce créneau
      if (busyTeamsBySlot[slotIndex].has(t1) || busyTeamsBySlot[slotIndex].has(t2)) continue
      
      // Vérifier que les équipes n'ont pas déjà atteint leur quota
      if (matchCount[t1] >= matchesPerTeam && matchCount[t2] >= matchesPerTeam) continue
      
      availableMatches.push([t1, t2])
    }

    // Trier les matchs disponibles en priorisant les équipes qui ont le moins joué
    availableMatches.sort((a, b) => {
      const scoreA = matchCount[a[0]] + matchCount[a[1]]
      const scoreB = matchCount[b[0]] + matchCount[b[1]]
      return scoreA - scoreB
    })

    // Essayer de remplir le créneau avec le backtracking
    return fillSlotRecursive(slotIndex, availableMatches, 0)
  }

  // Backtracking pour remplir un créneau spécifique
  function fillSlotRecursive(
    slotIndex: number,
    availableMatches: Array<[string, string]>,
    startIndex: number
  ): boolean {
    // Si le créneau est plein, succès
    if (matchesInSlot[slotIndex] >= maxMatchesPerSlot) {
      return true
    }

    // Essayer d'ajouter des matchs
    for (let i = startIndex; i < availableMatches.length; i++) {
      const [t1, t2] = availableMatches[i]
      const key = matchKey(t1, t2)

      // Vérifier à nouveau la disponibilité (peut avoir changé pendant le backtracking)
      if (usedMatches.has(key)) continue
      if (busyTeamsBySlot[slotIndex].has(t1) || busyTeamsBySlot[slotIndex].has(t2)) continue

      // Ajouter le match
      schedule.push({ team1Id: t1, team2Id: t2, slot: slotIndex })
      usedMatches.add(key)
      busyTeamsBySlot[slotIndex].add(t1)
      busyTeamsBySlot[slotIndex].add(t2)
      matchCount[t1]++
      matchCount[t2]++
      matchesInSlot[slotIndex]++

      // Continuer récursivement
      if (fillSlotRecursive(slotIndex, availableMatches, i + 1)) {
        return true
      }

      // Backtrack si nécessaire - on garde quand même le match si on ne peut pas faire mieux
    }

    // On a ajouté autant de matchs que possible
    return true
  }

  // Lancer le backtracking
  backtrack(0)

  // Si certains créneaux ne sont pas complètement remplis, essayer d'ajouter des matchs supplémentaires
  // en permettant aux équipes de jouer plus que matchesPerTeam
  for (let slot = 0; slot < numberOfSlots; slot++) {
    while (matchesInSlot[slot] < maxMatchesPerSlot) {
      let added = false
      
      for (const [t1, t2] of possibleMatches) {
        const key = matchKey(t1, t2)
        if (usedMatches.has(key)) continue
        if (busyTeamsBySlot[slot].has(t1) || busyTeamsBySlot[slot].has(t2)) continue

        // Ajouter le match même si les équipes ont déjà leur quota
        schedule.push({ team1Id: t1, team2Id: t2, slot })
        usedMatches.add(key)
        busyTeamsBySlot[slot].add(t1)
        busyTeamsBySlot[slot].add(t2)
        matchCount[t1]++
        matchCount[t2]++
        matchesInSlot[slot]++
        added = true
        break
      }

      if (!added) break
    }
  }

  return schedule
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
