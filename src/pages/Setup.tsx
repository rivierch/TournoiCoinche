import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTournamentStore } from '../store/tournamentStore'
import TeamForm from '../components/TeamForm'
import TeamList from '../components/TeamList'
import type { Team } from '../types'

export default function Setup() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    loadTournament,
    getCurrentTournament,
    loadFromStorage,
    isLoaded,
    addTeam,
    updateTeam,
    removeTeam,
    updateTournamentSettings,
    startPoolPhase,
  } = useTournamentStore()

  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

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

  const handleAddTeam = (teamData: Omit<Team, 'id'>) => {
    addTeam(teamData)
  }

  const handleUpdateTeam = (team: Team) => {
    updateTeam(team)
    setEditingTeam(null)
  }

  const handleDeleteTeam = (teamId: string) => {
    if (confirm('Supprimer cette équipe ?')) {
      removeTeam(teamId)
    }
  }

  const handleStartTournament = () => {
    if (tournament.teams.length < 2) {
      alert('Il faut au moins 2 équipes pour démarrer le tournoi')
      return
    }
    startPoolPhase()
    navigate(`/pool/${tournament.id}`)
  }

  const canStart = tournament.teams.length >= 2

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
              Retour
            </button>
            <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
            <p className="text-green-200">Configuration du tournoi</p>
          </div>
          <button
            onClick={handleStartTournament}
            disabled={!canStart}
            className={`btn-success text-lg px-6 py-3 ${!canStart ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Démarrer le tournoi
            <span className="ml-2">→</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Paramètres */}
          <div className="card-container">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Paramètres</h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Matchs par équipe (phase de poules)</label>
                <input
                  type="number"
                  min={1}
                  max={tournament.teams.length > 1 ? tournament.teams.length - 1 : 10}
                  value={tournament.settings.matchesPerTeam}
                  onChange={(e) => updateTournamentSettings({ matchesPerTeam: parseInt(e.target.value) || 1 })}
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nombre de matchs que chaque équipe jouera en poules
                </p>
              </div>

              <div>
                <label className="label">Équipes qualifiées pour la finale</label>
                <select
                  value={tournament.settings.teamsQualifiedForFinals}
                  onChange={(e) => updateTournamentSettings({ teamsQualifiedForFinals: parseInt(e.target.value) })}
                  className="input-field"
                >
                  <option value={2}>2 (finale directe)</option>
                  <option value={4}>4 (demi-finales)</option>
                  <option value={8}>8 (quarts de finale)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-700 mb-2">Organisation des tables</h3>
                <div className="space-y-3">
                  <div>
                    <label className="label">Nombre de tables</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={tournament.settings.numberOfTables}
                      onChange={(e) => updateTournamentSettings({ numberOfTables: parseInt(e.target.value) || 1 })}
                      className="input-field"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tables disponibles pour jouer simultanément
                    </p>
                  </div>
                  <div>
                    <label className="label">Durée d'un match (minutes)</label>
                    <input
                      type="number"
                      min={10}
                      max={120}
                      step={5}
                      value={tournament.settings.matchDurationMinutes}
                      onChange={(e) => updateTournamentSettings({ matchDurationMinutes: parseInt(e.target.value) || 30 })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Heure de début</label>
                    <input
                      type="time"
                      value={tournament.settings.startTime || '09:00'}
                      onChange={(e) => updateTournamentSettings({ startTime: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-700 mb-2">Points de classement</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Victoire</label>
                    <input
                      type="number"
                      min={0}
                      value={tournament.settings.pointsForWin}
                      onChange={(e) => updateTournamentSettings({ pointsForWin: parseInt(e.target.value) || 0 })}
                      className="input-field text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Nul</label>
                    <input
                      type="number"
                      min={0}
                      value={tournament.settings.pointsForDraw}
                      onChange={(e) => updateTournamentSettings({ pointsForDraw: parseInt(e.target.value) || 0 })}
                      className="input-field text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Défaite</label>
                    <input
                      type="number"
                      min={0}
                      value={tournament.settings.pointsForLoss}
                      onChange={(e) => updateTournamentSettings({ pointsForLoss: parseInt(e.target.value) || 0 })}
                      className="input-field text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire d'ajout/modification */}
          <div className="card-container">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editingTeam ? 'Modifier l\'équipe' : 'Ajouter une équipe'}
            </h2>
            <TeamForm
              team={editingTeam}
              onSubmit={editingTeam ? (team: Team | Omit<Team, 'id'>) => handleUpdateTeam(team as Team) : handleAddTeam}
              onCancel={editingTeam ? () => setEditingTeam(null) : undefined}
            />
          </div>

          {/* Liste des équipes */}
          <div className="card-container">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Équipes ({tournament.teams.length})
              </h2>
            </div>
            
            {tournament.teams.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucune équipe ajoutée
              </p>
            ) : (
              <TeamList
                teams={tournament.teams}
                onEdit={setEditingTeam}
                onDelete={handleDeleteTeam}
              />
            )}
          </div>
        </div>

        {/* Message d'aide */}
        {tournament.teams.length < 2 && (
          <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800">
            <p className="font-medium">💡 Ajoutez au moins 2 équipes pour pouvoir démarrer le tournoi</p>
          </div>
        )}
      </div>
    </div>
  )
}
