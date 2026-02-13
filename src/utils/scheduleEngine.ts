import type { Match } from '../types'

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
