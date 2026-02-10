import { Link, useLocation } from 'react-router-dom'
import { Wrench, ChevronRight } from 'lucide-react'
import './Layout.css'

const toolNames = {
  '/products-parser': 'Products Data Parser',
  '/prompts-parser': 'Prompts Parser',
}

export default function Layout({ children }) {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const currentTool = toolNames[location.pathname]

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <Wrench size={20} />
            </div>
            <span className="logo-text">Product Dev Tools</span>
          </Link>

          {currentTool && (
            <div className="breadcrumb">
              <ChevronRight size={16} className="breadcrumb-sep" />
              <span className="breadcrumb-current">{currentTool}</span>
            </div>
          )}
        </div>
      </header>

      <main className={`main ${isHome ? 'main-home' : 'main-tool'}`}>
        {children}
      </main>

      <footer className="footer">
        <p>Internal Tools &middot; Product Dev Team</p>
      </footer>
    </div>
  )
}
