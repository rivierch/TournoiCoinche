import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTournamentStore } from '../store/tournamentStore'
import Bracket from '../components/Bracket'
import { isBracketComplete } from '../utils/bracketGenerator'

export default function FinalPhase() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    loadTournament,
    getCurrentTournament,
    loadFromStorage,
    isLoaded,
    updateMatchScore,
    completeTournament,
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

  const bracketComplete = isBracketComplete(tournament.finalMatches)

  const handleScoreUpdate = (matchId: string, scoreTeam1: number, scoreTeam2: number) => {
    updateMatchScore(matchId, scoreTeam1, scoreTeam2, 'final')
  }

  const handleComplete = () => {
    completeTournament()
    navigate(`/results/${tournament.id}`)
  }

  const getTeamById = (teamId: string) => {
    return tournament.teams.find((t) => t.id === teamId)
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate('/')}
                className="text-green-200 hover:text-white flex items-center gap-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Accueil
              </button>
              <button
                onClick={() => navigate(`/setup/${tournament.id}`)}
                className="text-green-200 hover:text-white flex items-center gap-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configuration
              </button>
            </div>
            <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
            <p className="text-green-200">Phase finale - Élimination directe</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/pool/${tournament.id}`)}
              className="btn-secondary"
            >
              Voir les poules
            </button>
            <button
              onClick={handleComplete}
              disabled={!bracketComplete}
              className={`btn-success text-lg px-6 py-3 ${!bracketComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Terminer le tournoi
              <span className="ml-2">🏆</span>
            </button>
          </div>
        </div>

        {/* Bracket */}
        <Bracket
          matches={tournament.finalMatches}
          teams={tournament.teams}
          onScoreUpdate={handleScoreUpdate}
          getTeamById={getTeamById}
        />

        {/* Message d'aide */}
        {!bracketComplete && (
          <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800">
            <p className="font-medium">
              💡 Complétez tous les matchs du bracket pour terminer le tournoi
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
