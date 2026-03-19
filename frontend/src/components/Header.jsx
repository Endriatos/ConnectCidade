import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, ChevronDown, LogOut } from 'lucide-react'
import useAuthStore from '../store/authStore'
import logoCC from '../assets/logoCC.png'

export default function Header() {
  const { nome, logout } = useAuthStore()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef(null)

  const primeiroNome = nome ? nome.split(' ')[0] : 'Usuário'

  useEffect(() => {
    function handleClickFora(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="mx-auto px-6 h-16 flex items-center justify-between" style={{ maxWidth: '1400px' }}>

        <Link to="/home" className="flex items-center">
          <img src={logoCC} alt="Connect Cidade" className="h-9" />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/home"
            className="inline-flex items-center px-3 py-2 rounded-lg border border-[#2a2a2a]/10 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
          >
            Mapa
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuAberto((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2a2a2a]/10 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
            >
              <User className="h-4 w-4 text-[#2a2a2a]/40" />
              {primeiroNome}
              <ChevronDown className="h-3.5 w-3.5 text-[#2a2a2a]/40" />
            </button>

            {menuAberto && (
              <div className="absolute right-0 mt-1 w-36 rounded-xl border border-[#2a2a2a]/8 bg-white shadow-lg py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#2a2a2a]/5 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-[#2a2a2a]/40" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  )
}
