import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Home from './pages/Home'
import NovaSolicitacao from './pages/NovaSolicitacao'
import Health from './pages/Health'
import RotaProtegida from './components/RotaProtegida'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/health" element={<Health />} />

        {/* Rotas protegidas — exigem token JWT */}
        <Route path="/home" element={<RotaProtegida><Home /></RotaProtegida>} />
        <Route path="/nova-solicitacao" element={<RotaProtegida><NovaSolicitacao /></RotaProtegida>} />

        {/* Qualquer rota desconhecida volta para a landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
