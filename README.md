# Tournoi Coinche

Application desktop pour gérer des tournois de coinche/belote avec deux phases : poules et élimination directe.

## Fonctionnalités

- **Gestion des équipes** : Ajout, modification et suppression d'équipes (2 joueurs par équipe)
- **Phase de poules** : 
  - Tirage au sort automatique des matchs
  - Nombre de matchs configurable par équipe
  - Classement en temps réel
- **Phase finale** :
  - Élimination directe (quarts, demis, finale)
  - Bracket visuel
  - Match pour la 3ème place
- **Résultats** :
  - Podium
  - Statistiques du tournoi
  - Historique complet des matchs
- **Persistance** : Les tournois sont sauvegardés localement

## Installation

```bash
# Installer les dépendances
npm install

# Lancer en mode développement (web uniquement)
npm run dev

# Lancer l'application Electron en développement
npm run electron:dev

# Construire l'application pour la production
npm run electron:build
```

## Technologies

- **Electron** - Application desktop cross-platform
- **React 18** - Interface utilisateur
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styles
- **Zustand** - Gestion d'état
- **Vite** - Build tool
- **electron-store** - Stockage local persistant

## Structure du projet

```
belote/
├── electron/           # Code Electron (main process)
│   ├── main.ts        # Point d'entrée Electron
│   └── preload.ts     # Bridge sécurisé vers le renderer
├── src/
│   ├── components/    # Composants React réutilisables
│   ├── pages/         # Pages de l'application
│   ├── store/         # Store Zustand
│   ├── types/         # Types TypeScript
│   ├── utils/         # Utilitaires (tirage, calculs, etc.)
│   ├── App.tsx        # Composant racine
│   ├── main.tsx       # Point d'entrée React
│   └── index.css      # Styles globaux
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Utilisation

1. **Créer un tournoi** : Depuis l'accueil, donnez un nom à votre tournoi
2. **Ajouter des équipes** : Entrez le nom de l'équipe et les deux joueurs
3. **Configurer** : Définissez le nombre de matchs par équipe et le nombre de qualifiés
4. **Phase de poules** : Saisissez les scores des matchs, suivez le classement
5. **Phase finale** : Une fois les poules terminées, passez à l'élimination directe
6. **Résultats** : Consultez le podium et les statistiques

## Règles de classement (phase de poules)

1. Points de classement (3 pts victoire, 1 pt nul, 0 pt défaite)
2. Différence de points (marqués - encaissés)
3. Points marqués
4. Confrontation directe
