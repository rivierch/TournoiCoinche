import type { Team } from '../types'

interface TeamListProps {
  teams: Team[]
  onEdit?: (team: Team) => void
  onDelete?: (teamId: string) => void
  showRank?: boolean
}

export default function TeamList({ teams, onEdit, onDelete, showRank = false }: TeamListProps) {
  return (
    <div className="space-y-2">
      {teams.map((team, index) => (
        <div
          key={team.id}
          className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showRank && (
                <span className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${index === 0 ? 'bg-yellow-400 text-yellow-900' : ''}
                  ${index === 1 ? 'bg-gray-300 text-gray-700' : ''}
                  ${index === 2 ? 'bg-orange-400 text-orange-900' : ''}
                  ${index > 2 ? 'bg-gray-200 text-gray-600' : ''}
                `}>
                  {index + 1}
                </span>
              )}
              <div>
                <h3 className="font-medium text-gray-800">{team.name}</h3>
                <p className="text-sm text-gray-500">
                  {team.player1} & {team.player2}
                </p>
              </div>
            </div>
            
            {(onEdit || onDelete) && (
              <div className="flex gap-1">
                {onEdit && (
                  <button
                    onClick={() => onEdit(team)}
                    className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                    title="Modifier"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(team.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
