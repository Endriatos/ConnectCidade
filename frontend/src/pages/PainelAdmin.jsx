import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Settings2 } from 'lucide-react'
import Header from '../components/Header'

const navItem = ({ isActive }) =>
  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
    isActive
      ? 'bg-[#3cb478]/10 text-[#3cb478]'
      : 'text-[#2a2a2a]/60 hover:bg-[#2a2a2a]/5 hover:text-[#2a2a2a]'
  }`

export default function PainelAdmin() {
  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa]">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-52 shrink-0 border-r border-black/8 bg-white flex flex-col">
          <nav className="flex-1 py-4 px-3 space-y-1">
            <NavLink to="/admin" end className={navItem}>
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              Dashboard
            </NavLink>
            <NavLink to="/admin/solicitacoes" className={navItem}>
              <Settings2 className="h-4 w-4 shrink-0" />
              Gerenciar
            </NavLink>
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
