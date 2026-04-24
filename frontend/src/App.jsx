import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Landing from './pages/Landing'
import Login from './pages/Login'
import EsqueciSenha from './pages/EsqueciSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import Cadastro from './pages/Cadastro'
import AguardandoVerificacao from './pages/AguardandoVerificacao'
import VerificarEmail from './pages/VerificarEmail'
import Home from './pages/Home'
import NovaSolicitacao from './pages/NovaSolicitacao'
import MinhasSolicitacoes from './pages/MinhasSolicitacoes'
import DetalheMinhaSolicitacao from './pages/DetalheMinhaSolicitacao'
import MeuPerfil from './pages/MeuPerfil'
import ContinuarAposLogin from './pages/ContinuarAposLogin'
import Health from './pages/Health'
import PainelAdmin from './pages/PainelAdmin'
import Dashboard from './pages/admin/Dashboard'
import Solicitacoes from './pages/admin/Solicitacoes'
import Usuarios from './pages/admin/Usuarios'
import UsuarioGerenciar from './pages/admin/UsuarioGerenciar'
import MapaCidade from './pages/admin/MapaCidade'
import RotaProtegida from './components/RotaProtegida'
import RotaAdmin from './components/RotaAdmin'
import RotaSoCidadao from './components/RotaSoCidadao'
import RotaHome from './components/RotaHome'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/aguardando-verificacao" element={<AguardandoVerificacao />} />
        <Route path="/verificar-email" element={<VerificarEmail />} />
        <Route path="/health" element={<Health />} />

        {/* Rotas protegidas — exigem token JWT */}
        <Route
          path="/home"
          element={
            <RotaProtegida>
              <RotaHome>
                <Home />
              </RotaHome>
            </RotaProtegida>
          }
        />
        <Route path="/nova-solicitacao" element={<RotaProtegida><NovaSolicitacao /></RotaProtegida>} />
        <Route
          path="/minhas-solicitacoes"
          element={
            <RotaProtegida>
              <RotaSoCidadao>
                <MinhasSolicitacoes />
              </RotaSoCidadao>
            </RotaProtegida>
          }
        />
        <Route
          path="/minhas-solicitacoes/:idSolicitacao"
          element={
            <RotaProtegida>
              <RotaSoCidadao>
                <DetalheMinhaSolicitacao />
              </RotaSoCidadao>
            </RotaProtegida>
          }
        />
        <Route path="/meu-perfil" element={<RotaProtegida><MeuPerfil /></RotaProtegida>} />
        <Route path="/continuar" element={<RotaProtegida><ContinuarAposLogin /></RotaProtegida>} />

        {/* Painel administrativo — exige tipo ADMIN */}
        <Route path="/admin" element={<RotaAdmin><PainelAdmin /></RotaAdmin>}>
          <Route index element={<Dashboard />} />
          <Route path="mapa" element={<MapaCidade />} />
          <Route path="solicitacoes" element={<Solicitacoes />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="usuarios/:id" element={<UsuarioGerenciar />} />
        </Route>

        {/* Qualquer rota desconhecida volta para a landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
