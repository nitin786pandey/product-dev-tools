import { Link } from 'react-router-dom'
import { FileText, Database, BarChart3, Settings, Code, Search } from 'lucide-react'
import './Home.css'

const tools = [
  {
    id: 'products-parser',
    name: 'Products Data Parser',
    description: 'Parse raw product XML/text data into a clean, readable format with all fields organized.',
    icon: FileText,
    color: '#e5322d',
    bgColor: '#fef2f2',
    path: '/products-parser',
    ready: true,
  },
  {
    id: 'data-explorer',
    name: 'Data Explorer',
    description: 'Explore and query product catalogs, filter by attributes, and export results.',
    icon: Database,
    color: '#2563eb',
    bgColor: '#eff6ff',
    path: '#',
    ready: false,
  },
  {
    id: 'analytics',
    name: 'Analytics Dashboard',
    description: 'Visualize product metrics, pricing distribution, and inventory status.',
    icon: BarChart3,
    color: '#16a34a',
    bgColor: '#f0fdf4',
    path: '#',
    ready: false,
  },
  {
    id: 'config-builder',
    name: 'Config Builder',
    description: 'Generate configuration files for product feeds, integrations, and APIs.',
    icon: Settings,
    color: '#9333ea',
    bgColor: '#faf5ff',
    path: '#',
    ready: false,
  },
  {
    id: 'api-tester',
    name: 'API Tester',
    description: 'Test product API endpoints, inspect responses, and validate data schemas.',
    icon: Code,
    color: '#ea580c',
    bgColor: '#fff7ed',
    path: '#',
    ready: false,
  },
  {
    id: 'search-debugger',
    name: 'Search Debugger',
    description: 'Debug search results, ranking, and relevance scoring for products.',
    icon: Search,
    color: '#0891b2',
    bgColor: '#ecfeff',
    path: '#',
    ready: false,
  },
]

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1 className="hero-title">Product Dev Tools</h1>
        <p className="hero-subtitle">
          Internal toolkit for the product team. Parse data, debug integrations, and build faster.
        </p>
      </section>

      <section className="tools-section">
        <div className="tools-grid">
          {tools.map((tool) => {
            const Icon = tool.icon
            const CardWrapper = tool.ready ? Link : 'div'
            const cardProps = tool.ready ? { to: tool.path } : {}

            return (
              <CardWrapper
                key={tool.id}
                className={`tool-card ${!tool.ready ? 'tool-card-disabled' : ''}`}
                {...cardProps}
              >
                <div className="tool-icon" style={{ background: tool.bgColor, color: tool.color }}>
                  <Icon size={28} strokeWidth={1.8} />
                </div>
                <h3 className="tool-name">{tool.name}</h3>
                <p className="tool-desc">{tool.description}</p>
                {!tool.ready && <span className="tool-badge">Coming Soon</span>}
              </CardWrapper>
            )
          })}
        </div>
      </section>
    </div>
  )
}
