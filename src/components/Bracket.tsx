import { useState } from 'react'
import type { Match, Team } from '../types'

interface BracketProps {
  matches: Match[]
  teams: Team[]
  onScoreUpdate: (matchId: string, scoreTeam1: number, scoreTeam2: number) => void
  getTeamById: (teamId: string) => Team | undefined
}

export default function Bracket({ matches, onScoreUpdate, getTeamById }: BracketProps) {
  // Regrouper les matchs par phase
  const quarterFinals = matches.filter((m) => m.phase === 'quarterfinal')
  const semiFinals = matches.filter((m) => m.phase === 'semifinal')
  const finalMatch = matches.find((m) => m.phase === 'final')
  const thirdPlaceMatch = matches.find((m) => m.phase === 'third_place')

  const hasQuarterFinals = quarterFinals.length > 0

  return (
    <div className="card-container overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="flex justify-center gap-8">
          {/* Quarts de finale */}
          {hasQuarterFinals && (
            <div className="flex flex-col justify-around">
              <h3 className="text-center text-sm font-semibold text-gray-500 mb-4">
                Quarts de finale
              </h3>
              <div className="space-y-4">
                {quarterFinals.map((match) => (
                  <BracketMatch
                    key={match.id}
                    match={match}
                    team1={getTeamById(match.team1Id)}
                    team2={getTeamById(match.team2Id)}
                    onScoreUpdate={onScoreUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Demi-finales */}
          {semiFinals.length > 0 && (
            <div className="flex flex-col justify-around">
              <h3 className="text-center text-sm font-semibold text-gray-500 mb-4">
                Demi-finales
              </h3>
              <div className="space-y-8 flex flex-col justify-around h-full">
                {semiFinals.map((match) => (
                  <BracketMatch
                    key={match.id}
                    match={match}
                    team1={getTeamById(match.team1Id)}
                    team2={getTeamById(match.team2Id)}
                    onScoreUpdate={onScoreUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Finale */}
          <div className="flex flex-col justify-center">
            <h3 className="text-center text-sm font-semibold text-gray-500 mb-4">
              Finale
            </h3>
            {finalMatch && (
              <BracketMatch
                match={finalMatch}
                team1={getTeamById(finalMatch.team1Id)}
                team2={getTeamById(finalMatch.team2Id)}
                onScoreUpdate={onScoreUpdate}
                isFinal
              />
            )}
          </div>
        </div>

        {/* Match pour la 3ème place */}
        {thirdPlaceMatch && (thirdPlaceMatch.team1Id || thirdPlaceMatch.team2Id) && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-center text-sm font-semibold text-gray-500 mb-4">
              Match pour la 3ème place
            </h3>
            <div className="flex justify-center">
              <BracketMatch
                match={thirdPlaceMatch}
                team1={getTeamById(thirdPlaceMatch.team1Id)}
                team2={getTeamById(thirdPlaceMatch.team2Id)}
                onScoreUpdate={onScoreUpdate}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface BracketMatchProps {
  match: Match
  team1?: Team
  team2?: Team
  onScoreUpdate: (matchId: string, scoreTeam1: number, scoreTeam2: number) => void
  isFinal?: boolean
}

function BracketMatch({ match, team1, team2, onScoreUpdate, isFinal = false }: BracketMatchProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [score1, setScore1] = useState(match.scoreTeam1?.toString() || '')
  const [score2, setScore2] = useState(match.scoreTeam2?.toString() || '')

  const isComplete = match.scoreTeam1 !== null && match.scoreTeam2 !== null
  const team1Wins = isComplete && match.scoreTeam1! > match.scoreTeam2!
  const team2Wins = isComplete && match.scoreTeam2! > match.scoreTeam1!
  const canEdit = match.team1Id && match.team2Id

  const handleSave = () => {
    const s1 = parseInt(score1)
    const s2 = parseInt(score2)

    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      alert('Veuillez entrer des scores valides')
      return
    }

    if (s1 === s2) {
      alert('Il ne peut pas y avoir de match nul en phase finale')
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
    if (canEdit) {
      setScore1(match.scoreTeam1?.toString() || '')
      setScore2(match.scoreTeam2?.toString() || '')
      setIsEditing(true)
    }
  }

  const handleCardClick = () => {
    if (canEdit && !isEditing) {
      startEditing()
    }
  }

  return (
    <div
      onClick={canEdit && !isEditing ? handleCardClick : undefined}
      className={`
        w-56 rounded-lg border-2 overflow-hidden transition-all
        ${isFinal ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'}
        ${isComplete ? 'shadow-md' : ''}
        ${canEdit && !isEditing ? 'cursor-pointer hover:shadow-lg hover:border-primary-300' : ''}
      `}
    >
      {isFinal && (
        <div className="bg-yellow-400 text-yellow-900 text-center py-1 text-xs font-bold">
          🏆 FINALE 🏆
        </div>
      )}

      {/* Équipe 1 */}
      <div
        className={`
          p-2 flex items-center justify-between border-b
          ${team1Wins ? 'bg-green-100' : ''}
          ${!team1 ? 'bg-gray-100' : ''}
        `}
      >
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${team1Wins ? 'text-green-700' : 'text-gray-700'}`}>
            {team1?.name || (match.team1Id ? 'Chargement...' : 'En attente')}
          </div>
        </div>
        {isEditing ? (
          <input
            type="number"
            min={0}
            value={score1}
            onChange={(e) => setScore1(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-12 px-1 py-0.5 text-center text-sm font-bold border border-gray-300 rounded"
            autoFocus
          />
        ) : (
          <div className={`text-lg font-bold w-8 text-center ${team1Wins ? 'text-green-600' : 'text-gray-400'}`}>
            {match.scoreTeam1 !== null ? match.scoreTeam1 : '-'}
          </div>
        )}
      </div>

      {/* Équipe 2 */}
      <div
        className={`
          p-2 flex items-center justify-between
          ${team2Wins ? 'bg-green-100' : ''}
          ${!team2 ? 'bg-gray-100' : ''}
        `}
      >
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${team2Wins ? 'text-green-700' : 'text-gray-700'}`}>
            {team2?.name || (match.team2Id ? 'Chargement...' : 'En attente')}
          </div>
        </div>
        {isEditing ? (
          <input
            type="number"
            min={0}
            value={score2}
            onChange={(e) => setScore2(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-12 px-1 py-0.5 text-center text-sm font-bold border border-gray-300 rounded"
          />
        ) : (
          <div className={`text-lg font-bold w-8 text-center ${team2Wins ? 'text-green-600' : 'text-gray-400'}`}>
            {match.scoreTeam2 !== null ? match.scoreTeam2 : '-'}
          </div>
        )}
      </div>

      {/* Actions - uniquement en mode édition */}
      {canEdit && isEditing && (
        <div className="p-1 bg-gray-50 border-t">
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              className="flex-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            >
              OK
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleCancel(); }}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
