import type { Match, Team } from '../types'

/**
 * Assigne les tables et les créneaux horaires aux matchs
 * en s'assurant qu'une équipe ne joue pas deux matchs en même temps
 */
export function assignTablesAndSlots(
  matches: Match[],
  teams: Team[],
  numberOfTables: number
): Match[] {
  if (numberOfTables <= 0 || matches.length === 0) return matches

  // Créer une copie des matchs pour ne pas modifier l'original
  const scheduledMatches = [...matches]

  // Suivre les créneaux où chaque équipe joue
  const teamSlots: Record<string, Set<number>> = {}
  teams.forEach((team) => {
    teamSlots[team.id] = new Set()
  })

  // Suivre quelles tables sont utilisées à chaque créneau
  // slot -> set de tables utilisées
  const slotTables: Record<number, Set<number>> = {}

  // Fonction pour vérifier si une équipe est disponible dans un créneau
  const isTeamAvailable = (teamId: string, slot: number): boolean => {
    return !teamSlots[teamId]?.has(slot)
  }

  // Fonction pour trouver le premier créneau disponible pour les deux équipes
  const findAvailableSlot = (team1Id: string, team2Id: string): number => {
    let slot = 0
    while (true) {
      if (isTeamAvailable(team1Id, slot) && isTeamAvailable(team2Id, slot)) {
        // Vérifier s'il y a une table disponible dans ce créneau
        if (!slotTables[slot]) {
          slotTables[slot] = new Set()
        }
        if (slotTables[slot].size < numberOfTables) {
          return slot
        }
      }
      slot++
      // Sécurité pour éviter une boucle infinie
      if (slot > 1000) break
    }
    return slot
  }

  // Assigner chaque match
  for (let i = 0; i < scheduledMatches.length; i++) {
    const match = scheduledMatches[i]

    // Trouver le premier créneau où les deux équipes sont disponibles ET il y a une table
    const assignedSlot = findAvailableSlot(match.team1Id, match.team2Id)

    // Initialiser le set de tables pour ce créneau si nécessaire
    if (!slotTables[assignedSlot]) {
      slotTables[assignedSlot] = new Set()
    }

    // Trouver une table disponible
    let assignedTable = 1
    for (let table = 1; table <= numberOfTables; table++) {
      if (!slotTables[assignedSlot].has(table)) {
        assignedTable = table
        break
      }
    }

    // Assigner le match
    scheduledMatches[i] = {
      ...match,
      timeSlot: assignedSlot,
      tableNumber: assignedTable,
    }

    // Mettre à jour les disponibilités
    slotTables[assignedSlot].add(assignedTable)
    
    // Marquer les équipes comme occupées dans ce créneau
    if (!teamSlots[match.team1Id]) teamSlots[match.team1Id] = new Set()
    if (!teamSlots[match.team2Id]) teamSlots[match.team2Id] = new Set()
    teamSlots[match.team1Id].add(assignedSlot)
    teamSlots[match.team2Id].add(assignedSlot)
  }

  // Trier par créneau puis par table
  scheduledMatches.sort((a, b) => {
    if ((a.timeSlot ?? 0) !== (b.timeSlot ?? 0)) {
      return (a.timeSlot ?? 0) - (b.timeSlot ?? 0)
    }
    return (a.tableNumber ?? 0) - (b.tableNumber ?? 0)
  })

  return scheduledMatches
}

/**
 * Calcule l'heure de début d'un créneau
 */
export function getSlotStartTime(
  slotNumber: number,
  startTime: string,
  matchDurationMinutes: number
): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const startMinutes = hours * 60 + minutes
  const slotMinutes = startMinutes + slotNumber * matchDurationMinutes
  
  const newHours = Math.floor(slotMinutes / 60) % 24
  const newMinutes = slotMinutes % 60
  
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
}

/**
 * Calcule l'heure de fin d'un créneau
 */
export function getSlotEndTime(
  slotNumber: number,
  startTime: string,
  matchDurationMinutes: number
): string {
  return getSlotStartTime(slotNumber + 1, startTime, matchDurationMinutes)
}

/**
 * Formate un créneau horaire pour l'affichage
 */
export function formatTimeSlot(
  slotNumber: number,
  startTime: string,
  matchDurationMinutes: number
): string {
  const start = getSlotStartTime(slotNumber, startTime, matchDurationMinutes)
  const end = getSlotEndTime(slotNumber, startTime, matchDurationMinutes)
  return `${start} - ${end}`
}

/**
 * Obtient le nombre total de créneaux nécessaires
 */
export function getTotalSlots(matches: Match[]): number {
  if (matches.length === 0) return 0
  const maxSlot = Math.max(...matches.map((m) => m.timeSlot ?? 0))
  return maxSlot + 1
}

/**
 * Regroupe les matchs par créneau horaire
 */
export function groupMatchesBySlot(matches: Match[]): Record<number, Match[]> {
  const grouped: Record<number, Match[]> = {}
  
  matches.forEach((match) => {
    const slot = match.timeSlot ?? 0
    if (!grouped[slot]) {
      grouped[slot] = []
    }
    grouped[slot].push(match)
  })

  // Trier les matchs dans chaque créneau par numéro de table
  Object.keys(grouped).forEach((slot) => {
    grouped[Number(slot)].sort((a, b) => (a.tableNumber ?? 0) - (b.tableNumber ?? 0))
  })

  return grouped
}

/**
 * Estime la durée totale du tournoi (phase de poules)
 */
export function estimateTournamentDuration(
  matches: Match[],
  matchDurationMinutes: number
): { slots: number; totalMinutes: number; hours: number; minutes: number } {
  const slots = getTotalSlots(matches)
  const totalMinutes = slots * matchDurationMinutes
  
  return {
    slots,
    totalMinutes,
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  }
}
