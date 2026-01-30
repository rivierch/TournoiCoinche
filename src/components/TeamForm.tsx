import { useState, useEffect } from 'react'
import type { Team } from '../types'

interface TeamFormProps {
  team?: Team | null
  onSubmit: (team: Omit<Team, 'id'> | Team) => void
  onCancel?: () => void
}

export default function TeamForm({ team, onSubmit, onCancel }: TeamFormProps) {
  const [name, setName] = useState('')
  const [player1, setPlayer1] = useState('')
  const [player2, setPlayer2] = useState('')

  useEffect(() => {
    if (team) {
      setName(team.name)
      setPlayer1(team.player1)
      setPlayer2(team.player2)
    } else {
      setName('')
      setPlayer1('')
      setPlayer2('')
    }
  }, [team])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !player1.trim() || !player2.trim()) {
      return
    }

    if (team) {
      onSubmit({ ...team, name: name.trim(), player1: player1.trim(), player2: player2.trim() })
    } else {
      onSubmit({ name: name.trim(), player1: player1.trim(), player2: player2.trim() })
    }

    if (!team) {
      setName('')
      setPlayer1('')
      setPlayer2('')
    }
  }

  const isValid = name.trim() && player1.trim() && player2.trim()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nom de l'équipe</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Les As de Pique"
          className="input-field"
        />
      </div>

      <div>
        <label className="label">Joueur 1</label>
        <input
          type="text"
          value={player1}
          onChange={(e) => setPlayer1(e.target.value)}
          placeholder="Prénom du joueur 1"
          className="input-field"
        />
      </div>

      <div>
        <label className="label">Joueur 2</label>
        <input
          type="text"
          value={player2}
          onChange={(e) => setPlayer2(e.target.value)}
          placeholder="Prénom du joueur 2"
          className="input-field"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={!isValid}
          className={`btn-primary flex-1 ${!isValid ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {team ? 'Modifier' : 'Ajouter'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Annuler
          </button>
        )}
      </div>
    </form>
  )
}
