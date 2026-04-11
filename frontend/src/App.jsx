import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Home from './pages/Home'
import NovaSolicitacao from './pages/NovaSolicitacao'
import MinhasSolicitacoes from './pages/MinhasSolicitacoes'
import DetalheMinhaSolicitacao from './pages/DetalheMinhaSolicitacao'
import MeuPerfil from './pages/MeuPerfil'
import Health from './pages/Health'
import PainelAdmin from './pages/PainelAdmin'
import Dashboard from './pages/admin/Dashboard'
import Solicitacoes from './pages/admin/Solicitacoes'
import Usuarios from './pages/admin/Usuarios'
import RotaProtegida from './components/RotaProtegida'
import RotaAdmin from './components/RotaAdmin'

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
        <Route path="/minhas-solicitacoes" element={<RotaProtegida><MinhasSolicitacoes /></RotaProtegida>} />
        <Route path="/minhas-solicitacoes/:idSolicitacao" element={<RotaProtegida><DetalheMinhaSolicitacao /></RotaProtegida>} />
        <Route path="/meu-perfil" element={<RotaProtegida><MeuPerfil /></RotaProtegida>} />

        {/* Painel administrativo — exige tipo ADMIN */}
        <Route path="/admin" element={<RotaAdmin><PainelAdmin /></RotaAdmin>}>
          <Route index element={<Dashboard />} />
          <Route path="solicitacoes" element={<Solicitacoes />} />
          <Route path="usuarios" element={<Usuarios />} />
        </Route>

        {/* Qualquer rota desconhecida volta para a landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
