import { Link } from 'react-router-dom'
import { FileText, MessageSquare, Database, BarChart3, Settings, Code, Search, MoreHorizontal, SlidersHorizontal } from 'lucide-react'
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
    id: 'prompts-parser',
    name: 'Prompts Parser',
    description: 'Parse XML-tagged prompts into readable sections (bot intro, instructions, workflows, etc.).',
    icon: MessageSquare,
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    path: '/prompts-parser',
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

const miscTools = [
  {
    id: 'prompt-configurator',
    name: 'Prompt Configurator',
    description: 'Configure order cancellation prompt templates (temporary UI). Real-time preview and one-click copy.',
    icon: SlidersHorizontal,
    color: '#9333ea',
    bgColor: '#faf5ff',
    path: '/prompt-configurator',
    ready: true,
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

      <section className="misc-section">
        <div className="misc-header">
          <div className="misc-header-icon">
            <MoreHorizontal size={22} />
          </div>
          <div>
            <h2 className="misc-title">Miscellaneous</h2>
            <p className="misc-desc">Experimental and temporary tools</p>
          </div>
        </div>
        <div className="misc-grid">
          {miscTools.map((tool) => {
            const Icon = tool.icon
            const CardWrapper = tool.ready ? Link : 'div'
            const cardProps = tool.ready ? { to: tool.path } : {}

            return (
              <CardWrapper
                key={tool.id}
                className={`misc-card ${!tool.ready ? 'misc-card-disabled' : ''}`}
                {...cardProps}
              >
                <div className="misc-card-icon" style={{ background: tool.bgColor, color: tool.color }}>
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <div className="misc-card-body">
                  <h3 className="misc-card-name">{tool.name}</h3>
                  <p className="misc-card-desc">{tool.description}</p>
                </div>
                {!tool.ready && <span className="tool-badge">Coming Soon</span>}
              </CardWrapper>
            )
          })}
        </div>
      </section>
    </div>
  )
}
