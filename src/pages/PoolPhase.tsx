import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTournamentStore } from '../store/tournamentStore'
import MatchCard from '../components/MatchCard'
import PoolStandings from '../components/PoolStandings'
import ScheduleView from '../components/ScheduleView'
import { calculateStandings, getPoolProgress, isPoolPhaseComplete } from '../utils/scoreCalculator'
import { estimateTournamentDuration } from '../utils/scheduleEngine'

export default function PoolPhase() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    loadTournament,
    getCurrentTournament,
    loadFromStorage,
    isLoaded,
    updateMatchScore,
    startFinalPhase,
    completeTournament,
  } = useTournamentStore()

  const [activeTab, setActiveTab] = useState<'schedule' | 'matches' | 'standings'>('schedule')

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

  const standings = calculateStandings(
    tournament.teams,
    tournament.poolMatches,
    tournament.settings
  )

  const progress = getPoolProgress(tournament.poolMatches)
  const canStartFinals = isPoolPhaseComplete(tournament.poolMatches)
  const duration = estimateTournamentDuration(
    tournament.poolMatches,
    tournament.settings.matchDurationMinutes
  )

  const handleScoreUpdate = (matchId: string, scoreTeam1: number, scoreTeam2: number) => {
    updateMatchScore(matchId, scoreTeam1, scoreTeam2, 'pool')
  }

  const noFinalPhase = Boolean(tournament.settings.noFinalPhase)

  const handleStartFinals = () => {
    if (!canStartFinals) {
      alert('Tous les matchs de poule doivent être terminés')
      return
    }
    startFinalPhase()
    navigate(`/final/${tournament.id}`)
  }

  const handleFinishTournament = () => {
    if (!canStartFinals) {
      alert('Tous les matchs de poule doivent être terminés')
      return
    }
    completeTournament()
    navigate(`/results/${tournament.id}`)
  }

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
            <p className="text-green-200">Phase de poules</p>
          </div>
          {noFinalPhase ? (
            <button
              onClick={handleFinishTournament}
              disabled={!canStartFinals}
              className={`btn-success text-lg px-6 py-3 ${!canStartFinals ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Terminer le tournoi
              <span className="ml-2">🏆</span>
            </button>
          ) : (
            <button
              onClick={handleStartFinals}
              disabled={!canStartFinals}
              className={`btn-success text-lg px-6 py-3 ${!canStartFinals ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Passer à la phase finale
              <span className="ml-2">→</span>
            </button>
          )}
        </div>

        {/* Barre de progression et infos */}
        <div className="card-container mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div>
              <span className="text-sm font-medium text-gray-700">
                Progression : {progress.completed} / {progress.total} matchs
              </span>
              <span className="text-sm font-bold text-primary-600 ml-2">{progress.percentage}%</span>
            </div>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>
                <strong>{tournament.settings.numberOfTables}</strong> tables
              </span>
              <span>
                <strong>{duration.slots}</strong> créneaux
              </span>
              <span>
                Durée estimée : <strong>{duration.hours}h{duration.minutes > 0 ? `${duration.minutes}` : ''}</strong>
              </span>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'bg-white text-gray-800 shadow'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Planning
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'matches'
                ? 'bg-white text-gray-800 shadow'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Tous les matchs ({tournament.poolMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'standings'
                ? 'bg-white text-gray-800 shadow'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Classement
          </button>
        </div>

        {/* Contenu */}
        {activeTab === 'schedule' && (
          <ScheduleView
            matches={tournament.poolMatches}
            teams={tournament.teams}
            settings={tournament.settings}
            onScoreUpdate={handleScoreUpdate}
          />
        )}
        
        {activeTab === 'matches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournament.poolMatches.map((match, index) => (
              <MatchCard
                key={match.id}
                match={match}
                team1={getTeamById(match.team1Id)}
                team2={getTeamById(match.team2Id)}
                matchNumber={index + 1}
                onScoreUpdate={handleScoreUpdate}
              />
            ))}
          </div>
        )}
        
        {activeTab === 'standings' && (
          <PoolStandings
            standings={standings}
            qualifiedCount={noFinalPhase ? 0 : tournament.settings.teamsQualifiedForFinals}
          />
        )}

        {/* Message d'aide */}
        {!canStartFinals && (
          <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800">
            <p className="font-medium">
              {noFinalPhase
                ? '💡 Terminez tous les matchs pour terminer le tournoi'
                : '💡 Terminez tous les matchs pour passer à la phase finale'}
            </p>
            {!noFinalPhase && (
              <p className="text-sm mt-1">
                Les {tournament.settings.teamsQualifiedForFinals} meilleures équipes seront qualifiées
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
