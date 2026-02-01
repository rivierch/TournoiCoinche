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
 * Algorithme optimisé pour remplir les créneaux en maximisant l'utilisation des tables
 * Priorité : remplir toutes les tables disponibles à chaque créneau
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

  // Fonction pour calculer le score de priorité d'un match
  // Plus le score est bas, plus le match est prioritaire
  const getMatchPriority = (t1: string, t2: string): number => {
    const count1 = matchCount[t1] || 0
    const count2 = matchCount[t2] || 0
    
    // Priorité aux équipes qui n'ont pas encore atteint leur quota
    const underQuota1 = count1 < matchesPerTeam ? 0 : 100
    const underQuota2 = count2 < matchesPerTeam ? 0 : 100
    
    // Score combiné : favorise les équipes qui ont le moins joué
    return underQuota1 + underQuota2 + count1 + count2
  }

  // Remplir chaque créneau en maximisant l'utilisation des tables
  for (let slot = 0; slot < numberOfSlots; slot++) {
    // Continuer tant qu'on peut ajouter des matchs dans ce créneau
    let canAddMore = true
    
    while (canAddMore && matchesInSlot[slot] < maxMatchesPerSlot) {
      canAddMore = false
      
      // Trouver le meilleur match disponible pour ce créneau
      let bestMatch: [string, string] | null = null
      let bestPriority = Infinity
      
      for (const [t1, t2] of possibleMatches) {
        const key = matchKey(t1, t2)
        
        // Vérifier que le match n'est pas déjà utilisé
        if (usedMatches.has(key)) continue
        
        // Vérifier que les deux équipes sont disponibles dans ce créneau
        if (busyTeamsBySlot[slot].has(t1) || busyTeamsBySlot[slot].has(t2)) continue
        
        // Calculer la priorité de ce match
        const priority = getMatchPriority(t1, t2)
        
        if (priority < bestPriority) {
          bestPriority = priority
          bestMatch = [t1, t2]
        }
      }
      
      // Si on a trouvé un match, l'ajouter
      if (bestMatch) {
        const [t1, t2] = bestMatch
        const key = matchKey(t1, t2)
        
        schedule.push({ team1Id: t1, team2Id: t2, slot })
        usedMatches.add(key)
        busyTeamsBySlot[slot].add(t1)
        busyTeamsBySlot[slot].add(t2)
        matchCount[t1]++
        matchCount[t2]++
        matchesInSlot[slot]++
        canAddMore = true
      }
    }
  }

  // Deuxième passe : si des créneaux ne sont pas remplis et qu'il reste des matchs possibles,
  // essayer d'ajouter des matchs supplémentaires (même si les équipes ont déjà leur quota)
  // Cela garantit une utilisation maximale des tables
  for (let slot = 0; slot < numberOfSlots; slot++) {
    while (matchesInSlot[slot] < maxMatchesPerSlot) {
      let added = false
      let bestMatch: [string, string] | null = null
      let bestPriority = Infinity
      
      for (const [t1, t2] of possibleMatches) {
        const key = matchKey(t1, t2)
        if (usedMatches.has(key)) continue
        if (busyTeamsBySlot[slot].has(t1) || busyTeamsBySlot[slot].has(t2)) continue
        
        // Priorité aux équipes qui ont le moins joué
        const priority = (matchCount[t1] || 0) + (matchCount[t2] || 0)
        if (priority < bestPriority) {
          bestPriority = priority
          bestMatch = [t1, t2]
        }
      }
      
      if (bestMatch) {
        const [t1, t2] = bestMatch
        const key = matchKey(t1, t2)
        
        schedule.push({ team1Id: t1, team2Id: t2, slot })
        usedMatches.add(key)
        busyTeamsBySlot[slot].add(t1)
        busyTeamsBySlot[slot].add(t2)
        matchCount[t1]++
        matchCount[t2]++
        matchesInSlot[slot]++
        added = true
      }

      if (!added) break
    }
  }

  // Troisième passe : s'il reste des équipes qui n'ont pas assez joué,
  // ajouter des créneaux supplémentaires si nécessaire
  const teamsNeedingMatches = teamIds.filter(id => matchCount[id] < matchesPerTeam)
  
  if (teamsNeedingMatches.length > 0) {
    let extraSlot = numberOfSlots
    let attempts = 0
    const maxExtraSlots = 10 // Limite de sécurité
    
    while (teamsNeedingMatches.some(id => matchCount[id] < matchesPerTeam) && attempts < maxExtraSlots) {
      busyTeamsBySlot.push(new Set())
      matchesInSlot.push(0)
      
      let addedInSlot = false
      
      while (matchesInSlot[extraSlot] < maxMatchesPerSlot) {
        let bestMatch: [string, string] | null = null
        let bestPriority = Infinity
        
        for (const [t1, t2] of possibleMatches) {
          const key = matchKey(t1, t2)
          if (usedMatches.has(key)) continue
          if (busyTeamsBySlot[extraSlot].has(t1) || busyTeamsBySlot[extraSlot].has(t2)) continue
          
          // Forte priorité aux équipes qui n'ont pas atteint leur quota
          const need1 = matchCount[t1] < matchesPerTeam ? -1000 : 0
          const need2 = matchCount[t2] < matchesPerTeam ? -1000 : 0
          const priority = need1 + need2 + matchCount[t1] + matchCount[t2]
          
          if (priority < bestPriority) {
            bestPriority = priority
            bestMatch = [t1, t2]
          }
        }
        
        if (bestMatch) {
          const [t1, t2] = bestMatch
          const key = matchKey(t1, t2)
          
          schedule.push({ team1Id: t1, team2Id: t2, slot: extraSlot })
          usedMatches.add(key)
          busyTeamsBySlot[extraSlot].add(t1)
          busyTeamsBySlot[extraSlot].add(t2)
          matchCount[t1]++
          matchCount[t2]++
          matchesInSlot[extraSlot]++
          addedInSlot = true
        } else {
          break
        }
      }
      
      if (!addedInSlot) break
      
      extraSlot++
      attempts++
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
