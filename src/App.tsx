import { Route, Routes, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Tv from './pages/Tv'
import Join from './pages/Join'
import Play from './pages/Play'
import Admin from './pages/Admin'
import Results from './pages/Results'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tv/:code" element={<Tv />} />
      <Route path="/join/:code" element={<Join />} />
      <Route path="/play/:code" element={<Play />} />
      <Route path="/admin/:code" element={<Admin />} />
      <Route path="/results/:code" element={<Results />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
