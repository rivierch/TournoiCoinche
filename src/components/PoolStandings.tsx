import type { TeamStanding } from '../types'

interface PoolStandingsProps {
  standings: TeamStanding[]
  qualifiedCount?: number
}

export default function PoolStandings({ standings, qualifiedCount = 0 }: PoolStandingsProps) {
  return (
    <div className="card-container overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">#</th>
            <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Équipe</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">J</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">G</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">N</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">P</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">PM</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">PE</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Diff</th>
            <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((standing, index) => {
            const isQualified = qualifiedCount > 0 && index < qualifiedCount
            const rank = index + 1
            
            return (
              <tr
                key={standing.teamId}
                className={`
                  border-b border-gray-100 last:border-0
                  ${isQualified ? 'bg-green-50' : ''}
                  hover:bg-gray-50 transition-colors
                `}
              >
                <td className="py-3 px-2">
                  <span
                    className={`
                      inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold
                      ${rank === 1 ? 'bg-yellow-400 text-yellow-900' : ''}
                      ${rank === 2 ? 'bg-gray-300 text-gray-700' : ''}
                      ${rank === 3 ? 'bg-orange-400 text-orange-900' : ''}
                      ${rank > 3 ? 'bg-gray-100 text-gray-600' : ''}
                    `}
                  >
                    {rank}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium text-gray-800">{standing.team.name}</div>
                      <div className="text-xs text-gray-500">
                        {standing.team.player1} & {standing.team.player2}
                      </div>
                    </div>
                    {isQualified && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                        Q
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 text-center text-gray-600">{standing.played}</td>
                <td className="py-3 px-2 text-center text-green-600 font-medium">{standing.won}</td>
                <td className="py-3 px-2 text-center text-gray-500">{standing.drawn}</td>
                <td className="py-3 px-2 text-center text-red-600 font-medium">{standing.lost}</td>
                <td className="py-3 px-2 text-center text-gray-600">{standing.pointsFor}</td>
                <td className="py-3 px-2 text-center text-gray-600">{standing.pointsAgainst}</td>
                <td className="py-3 px-2 text-center">
                  <span
                    className={`font-medium ${
                      standing.pointsDiff > 0
                        ? 'text-green-600'
                        : standing.pointsDiff < 0
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {standing.pointsDiff > 0 ? '+' : ''}
                    {standing.pointsDiff}
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className="text-lg font-bold text-primary-600">{standing.score}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Légende */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 flex flex-wrap gap-4">
        <span><strong>J</strong> = Joués</span>
        <span><strong>G</strong> = Gagnés</span>
        <span><strong>N</strong> = Nuls</span>
        <span><strong>P</strong> = Perdus</span>
        <span><strong>PM</strong> = Points Marqués</span>
        <span><strong>PE</strong> = Points Encaissés</span>
        <span><strong>Diff</strong> = Différence</span>
        <span><strong>Pts</strong> = Points de classement</span>
        {qualifiedCount > 0 && (
          <span className="text-green-600"><strong>Q</strong> = Qualifié pour la phase finale</span>
        )}
      </div>
    </div>
  )
}
