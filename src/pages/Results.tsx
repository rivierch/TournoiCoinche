import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTournamentStore } from '../store/tournamentStore'
import { calculateStandings, getTournamentStats } from '../utils/scoreCalculator'
import { getBracketResults } from '../utils/bracketGenerator'

export default function Results() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    loadTournament,
    getCurrentTournament,
    loadFromStorage,
    isLoaded,
  } = useTournamentStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (isLoaded && id) {
      loadTournament(id)
    }
  }, [isLoaded, id, loadTournament])

  const tournament = getCurrentTournament()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Tournoi non trouvé</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  const poolStandings = calculateStandings(
    tournament.teams,
    tournament.poolMatches,
    tournament.settings
  )

  const hasFinalPhase = tournament.finalMatches.length > 0
  const bracketResults = hasFinalPhase
    ? getBracketResults(tournament.finalMatches, tournament.teams)
    : { winner: null, runnerUp: null, thirdPlace: null }
  const stats = getTournamentStats([...tournament.poolMatches, ...tournament.finalMatches])

  const getTeamById = (teamId: string) => {
    return tournament.teams.find((t) => t.id === teamId)
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/')}
              className="text-green-200 hover:text-white mb-2 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Accueil
            </button>
            <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
            <p className="text-green-200">Résultats du tournoi</p>
          </div>
        </div>

        {/* Podium (masqué si pas de phase finale) */}
        {hasFinalPhase && (
          <div className="card-container mb-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">🏆 Podium 🏆</h2>
            
            <div className="flex justify-center items-end gap-4 mb-8">
              {/* 2ème place */}
              <div className="text-center">
                <div className="w-32 bg-gray-300 rounded-t-lg p-4" style={{ height: '120px' }}>
                  <div className="text-4xl mb-2">🥈</div>
                  <div className="font-bold text-gray-700">2ème</div>
                </div>
                <div className="bg-gray-200 p-3 rounded-b-lg">
                  <div className="font-semibold text-gray-800">
                    {bracketResults.runnerUp?.name || '-'}
                  </div>
                  {bracketResults.runnerUp && (
                    <div className="text-xs text-gray-500">
                      {bracketResults.runnerUp.player1} & {bracketResults.runnerUp.player2}
                    </div>
                  )}
                </div>
              </div>

              {/* 1ère place */}
              <div className="text-center">
                <div className="w-36 bg-yellow-400 rounded-t-lg p-4" style={{ height: '160px' }}>
                  <div className="text-5xl mb-2">🏆</div>
                  <div className="font-bold text-yellow-900">Champion</div>
                </div>
                <div className="bg-yellow-300 p-3 rounded-b-lg">
                  <div className="font-bold text-yellow-900 text-lg">
                    {bracketResults.winner?.name || '-'}
                  </div>
                  {bracketResults.winner && (
                    <div className="text-xs text-yellow-700">
                      {bracketResults.winner.player1} & {bracketResults.winner.player2}
                    </div>
                  )}
                </div>
              </div>

              {/* 3ème place */}
              <div className="text-center">
                <div className="w-32 bg-orange-400 rounded-t-lg p-4" style={{ height: '100px' }}>
                  <div className="text-4xl mb-2">🥉</div>
                  <div className="font-bold text-orange-900">3ème</div>
                </div>
                <div className="bg-orange-300 p-3 rounded-b-lg">
                  <div className="font-semibold text-orange-900">
                    {bracketResults.thirdPlace?.name || '-'}
                  </div>
                  {bracketResults.thirdPlace && (
                    <div className="text-xs text-orange-700">
                      {bracketResults.thirdPlace.player1} & {bracketResults.thirdPlace.player2}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statistiques */}
          <div className="card-container">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Statistiques du tournoi</h2>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Équipes participantes" value={tournament.teams.length} />
              <StatCard label="Matchs joués" value={stats.completedMatches} />
              <StatCard label="Points marqués" value={stats.totalPointsScored} />
              <StatCard label="Moyenne par match" value={stats.averagePointsPerMatch} />
              <StatCard label="Score le plus haut" value={stats.highestScore} />
              <StatCard label="Score le plus bas" value={stats.lowestScore} />
            </div>
          </div>

          {/* Classement final des poules (ou classement final si pas de phase finale) */}
          <div className="card-container">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {hasFinalPhase ? 'Classement phase de poules' : 'Classement final'}
            </h2>
            <div className="space-y-2">
              {poolStandings.map((standing, index) => (
                <div
                  key={standing.teamId}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${index === 0 ? 'bg-yellow-400 text-yellow-900' : ''}
                        ${index === 1 ? 'bg-gray-300 text-gray-700' : ''}
                        ${index === 2 ? 'bg-orange-400 text-orange-900' : ''}
                        ${index > 2 ? 'bg-gray-200 text-gray-600' : ''}
                      `}
                    >
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-700">{standing.team.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {standing.won}V - {standing.drawn}N - {standing.lost}P
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Historique des matchs */}
        <div className="card-container mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Historique des matchs</h2>
          
          {/* Matchs de poule */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Phase de poules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {tournament.poolMatches.map((match) => {
                const team1 = getTeamById(match.team1Id)
                const team2 = getTeamById(match.team2Id)
                const team1Wins = match.scoreTeam1! > match.scoreTeam2!
                
                return (
                  <div
                    key={match.id}
                    className="p-2 bg-gray-50 rounded text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className={team1Wins ? 'font-semibold' : ''}>
                        {team1?.name}
                      </span>
                      <span className="font-mono font-bold">
                        {match.scoreTeam1} - {match.scoreTeam2}
                      </span>
                      <span className={!team1Wins ? 'font-semibold' : ''}>
                        {team2?.name}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Matchs de phase finale (masqué si pas de phase finale) */}
          {hasFinalPhase && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Phase finale</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {tournament.finalMatches
                  .filter((m) => m.team1Id && m.team2Id && m.scoreTeam1 !== null)
                  .map((match) => {
                  const team1 = getTeamById(match.team1Id)
                  const team2 = getTeamById(match.team2Id)
                  const team1Wins = match.scoreTeam1! > match.scoreTeam2!
                  const phaseLabel = {
                    pool: 'Poule',
                    quarterfinal: 'Quart',
                    semifinal: 'Demi',
                    final: 'Finale',
                    third_place: '3ème place',
                  }[match.phase] || match.phase

                  return (
                    <div
                      key={match.id}
                      className={`p-2 rounded text-sm ${
                        match.phase === 'final' ? 'bg-yellow-100' : 'bg-gray-50'
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">{phaseLabel}</div>
                      <div className="flex items-center justify-between">
                        <span className={team1Wins ? 'font-semibold' : ''}>
                          {team1?.name}
                        </span>
                        <span className="font-mono font-bold">
                          {match.scoreTeam1} - {match.scoreTeam2}
                        </span>
                        <span className={!team1Wins ? 'font-semibold' : ''}>
                          {team2?.name}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bouton retour */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="btn-primary text-lg px-8 py-3"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-2xl font-bold text-primary-600">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}
