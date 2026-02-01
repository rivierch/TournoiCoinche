import { useState } from 'react'
import type { Match, Team } from '../types'

interface MatchCardProps {
  match: Match
  team1?: Team
  team2?: Team
  matchNumber?: number
  onScoreUpdate: (matchId: string, scoreTeam1: number, scoreTeam2: number) => void
  readonly?: boolean
  showTableInfo?: boolean
}

export default function MatchCard({
  match,
  team1,
  team2,
  matchNumber,
  onScoreUpdate,
  readonly = false,
  showTableInfo = true,
}: MatchCardProps) {
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
    if (!readonly) {
      setScore1(match.scoreTeam1?.toString() || '')
      setScore2(match.scoreTeam2?.toString() || '')
      setIsEditing(true)
    }
  }

  const handleCardClick = () => {
    if (!readonly && !isEditing) {
      startEditing()
    }
  }

  return (
    <div
      onClick={!readonly && !isEditing ? handleCardClick : undefined}
      className={`card-container ${isComplete ? 'border-l-4 border-green-500' : ''} ${!readonly && !isEditing ? 'cursor-pointer hover:shadow-md hover:border-primary-300 transition-all' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        {matchNumber && (
          <div className="text-xs text-gray-400">Match #{matchNumber}</div>
        )}
        {showTableInfo && match.tableNumber !== undefined && (
          <div className="flex items-center gap-2 text-xs">
            {match.timeSlot !== undefined && (
              <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                Créneau {match.timeSlot + 1}
              </span>
            )}
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              Table {match.tableNumber}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Équipe 1 */}
        <div className={`flex items-center justify-between p-2 rounded ${team1Wins ? 'bg-green-50' : ''}`}>
          <div className="flex-1">
            <div className={`font-medium ${team1Wins ? 'text-green-700' : 'text-gray-800'}`}>
              {team1?.name || 'Équipe inconnue'}
            </div>
            <div className="text-xs text-gray-500">
              {team1?.player1} & {team1?.player2}
            </div>
          </div>
          {isEditing ? (
            <input
              type="number"
              min={0}
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-20 px-2 py-1 text-center text-lg font-bold border border-gray-300 rounded"
              autoFocus
            />
          ) : (
            <div
              className={`text-2xl font-bold w-16 text-center ${
                team1Wins ? 'text-green-600' : isComplete ? 'text-gray-600' : 'text-gray-300'
              }`}
            >
              {match.scoreTeam1 !== null ? match.scoreTeam1 : '-'}
            </div>
          )}
        </div>

        {/* Séparateur */}
        <div className="flex items-center gap-2 px-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">VS</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Équipe 2 */}
        <div className={`flex items-center justify-between p-2 rounded ${team2Wins ? 'bg-green-50' : ''}`}>
          <div className="flex-1">
            <div className={`font-medium ${team2Wins ? 'text-green-700' : 'text-gray-800'}`}>
              {team2?.name || 'Équipe inconnue'}
            </div>
            <div className="text-xs text-gray-500">
              {team2?.player1} & {team2?.player2}
            </div>
          </div>
          {isEditing ? (
            <input
              type="number"
              min={0}
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-20 px-2 py-1 text-center text-lg font-bold border border-gray-300 rounded"
            />
          ) : (
            <div
              className={`text-2xl font-bold w-16 text-center ${
                team2Wins ? 'text-green-600' : isComplete ? 'text-gray-600' : 'text-gray-300'
              }`}
            >
              {match.scoreTeam2 !== null ? match.scoreTeam2 : '-'}
            </div>
          )}
        </div>
      </div>

      {/* Actions - uniquement en mode édition */}
      {!readonly && isEditing && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="btn-success flex-1 text-sm py-1">
              Valider
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleCancel(); }} className="btn-secondary text-sm py-1">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
