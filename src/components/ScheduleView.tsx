import { useState } from 'react'
import type { Match, Team, TournamentSettings } from '../types'
import { groupMatchesBySlot, formatTimeSlot } from '../utils/scheduleEngine'

interface ScheduleViewProps {
  matches: Match[]
  teams: Team[]
  settings: TournamentSettings
  onScoreUpdate: (matchId: string, scoreTeam1: number, scoreTeam2: number) => void
}

export default function ScheduleView({
  matches,
  teams,
  settings,
  onScoreUpdate,
}: ScheduleViewProps) {
  const matchesBySlot = groupMatchesBySlot(matches)
  const slots = Object.keys(matchesBySlot)
    .map(Number)
    .sort((a, b) => a - b)

  const getTeamById = (teamId: string) => {
    return teams.find((t) => t.id === teamId)
  }

  // Calculer les matchs complétés par créneau
  const getSlotProgress = (slotMatches: Match[]) => {
    const completed = slotMatches.filter(
      (m) => m.scoreTeam1 !== null && m.scoreTeam2 !== null
    ).length
    return { completed, total: slotMatches.length }
  }

  return (
    <div className="space-y-6">
      {slots.map((slot) => {
        const slotMatches = matchesBySlot[slot]
        const progress = getSlotProgress(slotMatches)
        const isComplete = progress.completed === progress.total
        const timeRange = formatTimeSlot(
          slot,
          settings.startTime || '09:00',
          settings.matchDurationMinutes
        )

        return (
          <div
            key={slot}
            className={`card-container ${isComplete ? 'border-l-4 border-green-500' : ''}`}
          >
            {/* En-tête du créneau */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-lg font-bold">
                  Créneau {slot + 1}
                </div>
                <div className="text-lg font-semibold text-gray-700">
                  {timeRange}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isComplete ? 'text-green-600' : 'text-gray-500'}`}>
                  {progress.completed}/{progress.total} matchs terminés
                </span>
                {isComplete && (
                  <span className="text-green-500 text-xl">✓</span>
                )}
              </div>
            </div>

            {/* Grille des tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {slotMatches.map((match) => (
                <TableMatchCard
                  key={match.id}
                  match={match}
                  team1={getTeamById(match.team1Id)}
                  team2={getTeamById(match.team2Id)}
                  onScoreUpdate={onScoreUpdate}
                />
              ))}
            </div>
          </div>
        )
      })}

      {slots.length === 0 && (
        <div className="card-container text-center text-gray-500 py-8">
          Aucun match programmé
        </div>
      )}
    </div>
  )
}

interface TableMatchCardProps {
  match: Match
  team1?: Team
  team2?: Team
  onScoreUpdate: (matchId: string, scoreTeam1: number, scoreTeam2: number) => void
}

function TableMatchCard({ match, team1, team2, onScoreUpdate }: TableMatchCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [score1, setScore1] = useState(match.scoreTeam1?.toString() || '')
  const [score2, setScore2] = useState(match.scoreTeam2?.toString() || '')

  const isComplete = match.scoreTeam1 !== null && match.scoreTeam2 !== null
  const team1Wins = isComplete && match.scoreTeam1! > match.scoreTeam2!
  const team2Wins = isComplete && match.scoreTeam2! > match.scoreTeam1!

  const handleSave = () => {
    const s1 = parseInt(score1)
    const s2 = parseInt(score2)

    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      alert('Veuillez entrer des scores valides')
      return
    }

    onScoreUpdate(match.id, s1, s2)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setScore1(match.scoreTeam1?.toString() || '')
    setScore2(match.scoreTeam2?.toString() || '')
    setIsEditing(false)
  }

  const startEditing = () => {
    setScore1(match.scoreTeam1?.toString() || '')
    setScore2(match.scoreTeam2?.toString() || '')
    setIsEditing(true)
  }

  const handleCardClick = () => {
    if (!isEditing) {
      startEditing()
    }
  }

  return (
    <div
      onClick={!isEditing ? handleCardClick : undefined}
      className={`
        border rounded-lg overflow-hidden transition-all
        ${isComplete ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}
        ${!isEditing ? 'cursor-pointer hover:shadow-md hover:border-primary-300' : ''}
      `}
    >
      {/* En-tête avec numéro de table */}
      <div
        className={`
          px-3 py-1.5 text-center text-sm font-bold
          ${isComplete ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}
        `}
      >
        Table {match.tableNumber}
      </div>

      <div className="p-3">
        {/* Équipe 1 */}
        <div className={`flex items-center justify-between mb-2 ${team1Wins ? 'font-semibold' : ''}`}>
          <div className="flex-1 truncate text-sm">
            {team1?.name || 'Équipe ?'}
          </div>
          {isEditing ? (
            <input
              type="number"
              min={0}
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-14 px-2 py-0.5 text-center text-sm border border-gray-300 rounded"
              autoFocus
            />
          ) : (
            <span
              className={`
                text-lg font-bold w-10 text-center
                ${team1Wins ? 'text-green-600' : isComplete ? 'text-gray-600' : 'text-gray-300'}
              `}
            >
              {match.scoreTeam1 !== null ? match.scoreTeam1 : '-'}
            </span>
          )}
        </div>

        {/* Séparateur */}
        <div className="text-center text-xs text-gray-400 my-1">vs</div>

        {/* Équipe 2 */}
        <div className={`flex items-center justify-between ${team2Wins ? 'font-semibold' : ''} ${isEditing ? 'mb-3' : ''}`}>
          <div className="flex-1 truncate text-sm">
            {team2?.name || 'Équipe ?'}
          </div>
          {isEditing ? (
            <input
              type="number"
              min={0}
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-14 px-2 py-0.5 text-center text-sm border border-gray-300 rounded"
            />
          ) : (
            <span
              className={`
                text-lg font-bold w-10 text-center
                ${team2Wins ? 'text-green-600' : isComplete ? 'text-gray-600' : 'text-gray-300'}
              `}
            >
              {match.scoreTeam2 !== null ? match.scoreTeam2 : '-'}
            </span>
          )}
        </div>

        {/* Actions - uniquement en mode édition */}
        {isEditing && (
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              className="flex-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            >
              Valider
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleCancel(); }}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
