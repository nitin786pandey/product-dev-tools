import { useState } from 'react'
import {
  FileText, Play, Trash2, Copy, CheckCircle2, XCircle,
  MessageSquare, ChevronDown, ChevronUp
} from 'lucide-react'
import { parsePrompts } from '../utils/parsePrompts'
import './PromptsParser.css'

const PLACEHOLDER_TEXT = 'Paste your XML-tagged prompt here...\n\nSupports prompts wrapped in <root> with tags like <bot_introduction>, <response_instructions>, <custom_prompt>, <processes>, etc.'

export default function PromptsParser() {
  const [rawText, setRawText] = useState('')
  const [sections, setSections] = useState([])
  const [parsed, setParsed] = useState(false)
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [copiedId, setCopiedId] = useState(null)

  const handleParse = () => {
    if (!rawText.trim()) return
    const result = parsePrompts(rawText)
    setSections(result)
    setParsed(true)
    setExpandedIds(new Set())
  }

  const handleClear = () => {
    setRawText('')
    setSections([])
    setParsed(false)
    setExpandedIds(new Set())
  }

  const toggleSection = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const topLevelCount = sections.length

  return (
    <div className="parser-page">
      <div className={`input-section ${parsed ? 'input-section-collapsed' : ''}`}>
        <div className="section-header">
          <div className="section-icon">
            <MessageSquare size={22} />
          </div>
          <div>
            <h2 className="section-title">Prompts Parser</h2>
            <p className="section-desc">
              Paste your XML-tagged prompt below and parse it into readable sections (bot intro, instructions, workflows, etc.).
            </p>
          </div>
        </div>

        <div className="textarea-wrapper">
          <textarea
            className="raw-input"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={PLACEHOLDER_TEXT}
            rows={parsed ? 4 : 12}
          />
          <div className="textarea-footer">
            <span className="char-count">{rawText.length.toLocaleString()} characters</span>
          </div>
        </div>

        <div className="action-bar">
          <button className="btn btn-primary" onClick={handleParse} disabled={!rawText.trim()}>
            <Play size={16} />
            Parse
          </button>
          <button className="btn btn-ghost" onClick={handleClear} disabled={!rawText.trim() && !parsed}>
            <Trash2 size={16} />
            Clear
          </button>
        </div>
      </div>

      {parsed && (
        <div className="results-section">
          <div className="results-header">
            <h3 className="results-title">
              Parsed sections
              <span className="results-count">{topLevelCount} section{topLevelCount !== 1 ? 's' : ''}</span>
            </h3>
          </div>

          {topLevelCount === 0 ? (
            <div className="empty-state">
              <XCircle size={40} />
              <p>No XML sections could be parsed. Check your input format.</p>
            </div>
          ) : (
            <div className="prompt-sections-list">
              {sections.map((node, idx) => (
                <PromptSectionCard
                  key={`${node.tagName}-${idx}`}
                  node={node}
                  id={`${node.tagName}-${idx}`}
                  depth={0}
                  expandedIds={expandedIds}
                  onToggle={toggleSection}
                  copiedId={copiedId}
                  onCopy={copyToClipboard}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PromptSectionCard({ node, id, depth, expandedIds, onToggle, copiedId, onCopy }) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedIds.has(id)
  const copyId = `copy-${id}`

  return (
    <div className={`prompt-section-card ${depth > 0 ? 'prompt-section-card-nested' : ''}`} style={depth > 0 ? { marginLeft: depth * 16 } : undefined}>
      <div className="prompt-section-header">
        <div className="prompt-section-title-row">
          {hasChildren && (
            <button
              type="button"
              className="prompt-section-expand-btn"
              onClick={() => onToggle(id)}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          <h3 className="prompt-section-title">{node.label}</h3>
          {(node.content || !hasChildren) && (
            <button
              type="button"
              className="copy-btn-inline"
              onClick={() => onCopy(node.content, copyId)}
              title="Copy section content"
            >
              {copiedId === copyId ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            </button>
          )}
        </div>
      </div>

      {node.content && (
        <div className="prompt-section-content">
          <pre className="prompt-section-text">{node.content}</pre>
        </div>
      )}

      {hasChildren && isExpanded && (
        <div className="prompt-section-children">
          {node.children.map((child, idx) => (
            <PromptSectionCard
              key={`${child.tagName}-${idx}`}
              node={child}
              id={`${id}-${child.tagName}-${idx}`}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              copiedId={copiedId}
              onCopy={onCopy}
            />
          ))}
        </div>
      )}
    </div>
  )
}
