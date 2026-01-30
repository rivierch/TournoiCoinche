import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Setup from './pages/Setup'
import PoolPhase from './pages/PoolPhase'
import FinalPhase from './pages/FinalPhase'
import Results from './pages/Results'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/setup/:id?" element={<Setup />} />
        <Route path="/pool/:id" element={<PoolPhase />} />
        <Route path="/final/:id" element={<FinalPhase />} />
        <Route path="/results/:id" element={<Results />} />
      </Routes>
    </div>
  )
}

export default App
