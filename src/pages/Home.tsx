import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTournamentStore } from '../store/tournamentStore'
import type { TournamentSummary } from '../types'

export default function Home() {
  const navigate = useNavigate()
  const { 
    createTournament, 
    loadTournament, 
    deleteTournament, 
    getTournamentList,
    loadFromStorage,
    isLoaded 
  } = useTournamentStore()
  
  const [tournamentName, setTournamentName] = useState('')
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([])
  const [showNewForm, setShowNewForm] = useState(false)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (isLoaded) {
      setTournaments(getTournamentList())
    }
  }, [isLoaded, getTournamentList])

  const handleCreateTournament = () => {
    if (!tournamentName.trim()) return
    const tournament = createTournament(tournamentName.trim())
    navigate(`/setup/${tournament.id}`)
  }

  const handleLoadTournament = (id: string) => {
    const tournament = loadTournament(id)
    if (!tournament) return

    switch (tournament.status) {
      case 'setup':
        navigate(`/setup/${id}`)
        break
      case 'pool_phase':
        navigate(`/pool/${id}`)
        break
      case 'final_phase':
        navigate(`/final/${id}`)
        break
      case 'completed':
        navigate(`/results/${id}`)
        break
    }
  }

  const handleDeleteTournament = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Supprimer ce tournoi ?')) {
      deleteTournament(id)
      setTournaments(getTournamentList())
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'setup':
        return { label: 'Configuration', color: 'bg-yellow-100 text-yellow-800' }
      case 'pool_phase':
        return { label: 'Phase de poules', color: 'bg-blue-100 text-blue-800' }
      case 'final_phase':
        return { label: 'Phase finale', color: 'bg-purple-100 text-purple-800' }
      case 'completed':
        return { label: 'Terminé', color: 'bg-green-100 text-green-800' }
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="text-6xl">♠️ ♥️ ♣️ ♦️</div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Tournoi Coinche</h1>
          <p className="text-green-200">Gérez vos tournois de coinche facilement</p>
        </div>

        {/* Actions principales */}
        <div className="card-container mb-8">
          {!showNewForm ? (
            <button
              onClick={() => setShowNewForm(true)}
              className="w-full btn-primary text-lg py-4 flex items-center justify-center gap-2"
            >
              <span className="text-2xl">+</span>
              Nouveau Tournoi
            </button>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Créer un nouveau tournoi</h2>
              <div>
                <label className="label">Nom du tournoi</label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTournament()}
                  placeholder="Ex: Tournoi de Noël 2024"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handleCreateTournament} className="btn-success flex-1">
                  Créer
                </button>
                <button 
                  onClick={() => {
                    setShowNewForm(false)
                    setTournamentName('')
                  }} 
                  className="btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Liste des tournois */}
        {tournaments.length > 0 && (
          <div className="card-container">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tournois existants</h2>
            <div className="space-y-3">
              {tournaments
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .map((tournament) => {
                  const status = getStatusLabel(tournament.status)
                  return (
                    <div
                      key={tournament.id}
                      onClick={() => handleLoadTournament(tournament.id)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-gray-50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800 group-hover:text-primary-600">
                            {tournament.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {tournament.teamCount} équipe{tournament.teamCount > 1 ? 's' : ''} • 
                            Modifié le {formatDate(tournament.updatedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                          <button
                            onClick={(e) => handleDeleteTournament(tournament.id, e)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Message si aucun tournoi */}
        {isLoaded && tournaments.length === 0 && !showNewForm && (
          <div className="text-center text-green-200 py-8">
            <p className="text-lg">Aucun tournoi créé</p>
            <p className="text-sm opacity-75">Créez votre premier tournoi pour commencer !</p>
          </div>
        )}
      </div>
    </div>
  )
}
