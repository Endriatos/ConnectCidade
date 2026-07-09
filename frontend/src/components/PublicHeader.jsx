import { Link } from 'react-router-dom'
import iconCC from '../assets/iconCC.png'

const linkEntrar =
  'text-sm font-medium text-[#2a2a2a]/60 hover:text-[#2a2a2a] transition-colors'
const linkCadastrar =
  'text-sm font-medium px-4 py-2 rounded-lg bg-[#3cb478] text-white hover:bg-[#349d69] transition-colors'

export default function PublicHeader({ variant = 'auth' }) {
  return (
    <header className="sticky top-0 z-40 w-full min-w-0 border-b border-black/8 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="mx-auto flex h-16 min-w-0 max-w-[1400px] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3cb478]/35 focus-visible:ring-offset-2"
          aria-label="Connect Cidade"
        >
          <img src={iconCC} alt="" className="h-9 w-9 object-contain" />
          <span className="hidden md:block text-[15px] font-semibold text-[#2a2a2a] tracking-tight">
            Connect Cidade
          </span>
        </Link>

        {variant === 'auth' && (
          <div className="flex shrink-0 items-center gap-3 translate-y-px">
            <Link to="/login" className={linkEntrar}>
              Entrar
            </Link>
            <Link to="/cadastro" className={linkCadastrar}>
              Cadastrar
            </Link>
          </div>
        )}

        {variant === 'login' && (
          <Link to="/login" className={`${linkEntrar} shrink-0 translate-y-px`}>
            Entrar
          </Link>
        )}
      </div>
    </header>
  )
}
