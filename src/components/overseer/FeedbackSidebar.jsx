import { AlertCircle, AlertTriangle, Info, ThumbsUp } from 'lucide-react'

const SEVERITY_ICONS = {
  error: AlertCircle,
  warning: AlertTriangle,
  suggestion: Info,
  praise: ThumbsUp,
}

const SEVERITY_LABELS = {
  error: 'Error',
  warning: 'Warning',
  suggestion: 'Suggestion',
  praise: 'Praise',
}

function getSummary(feedback) {
  const byCategory = {}
  const bySeverity = {}
  for (const f of feedback) {
    const cat = f.category || 'general'
    byCategory[cat] = (byCategory[cat] || 0) + 1
    const sev = f.severity || 'suggestion'
    bySeverity[sev] = (bySeverity[sev] || 0) + 1
  }
  const parts = []
  const order = ['clarity', 'economy', 'structure', 'tone', 'correctness', 'strength']
  for (const cat of order) {
    const n = byCategory[cat]
    if (n) {
      const label = cat === 'economy' ? 'verbosity' : cat
      parts.push(`${n} ${label} ${n === 1 ? 'flag' : 'flags'}`)
    }
  }
  return parts.length ? parts.join(', ') : 'No issues found'
}

export default function FeedbackSidebar({ feedback = [], containerRef }) {
  const summary = getSummary(feedback)

  const handleClick = (item) => {
    if (containerRef?.current && item.start >= 0) {
      const editor = containerRef.current.querySelector('.wo-editor')
      if (editor) {
        const textNode = getFirstTextNode(editor)
        if (textNode) {
          try {
            const range = document.createRange()
            range.setStart(textNode, Math.min(item.start, textNode.length))
            range.setEnd(textNode, Math.min(item.end, textNode.length))
            range.collapse(true)
            const sel = window.getSelection()
            sel.removeAllRanges()
            sel.addRange(range)
            editor.focus()
            range.startContainer.parentElement?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
          } catch {
            // ignore
          }
        }
      }
    }
  }

  if (feedback.length === 0) {
    return (
      <div className="wo-sidebar">
        <div className="wo-sidebar-header">
          <h3 className="wo-sidebar-title">Feedback</h3>
          <p className="wo-sidebar-summary wo-sidebar-empty">No feedback yet. Keep writing.</p>
        </div>
        <div className="wo-sidebar-list wo-sidebar-empty-state">
          <p>Analysis runs when you pause typing. Write a few sentences to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="wo-sidebar">
      <div className="wo-sidebar-header">
        <h3 className="wo-sidebar-title">Feedback</h3>
        <p className="wo-sidebar-summary">{summary}</p>
      </div>
      <div className="wo-sidebar-list">
        {feedback.map((item, i) => {
          const Icon = SEVERITY_ICONS[item.severity] || Info
          return (
            <button
              key={i}
              type="button"
              className={`wo-sidebar-item wo-severity-${item.severity || 'suggestion'}`}
              onClick={() => handleClick(item)}
            >
              <Icon size={16} className="wo-sidebar-item-icon" />
              <div className="wo-sidebar-item-body">
                <span className="wo-sidebar-item-label">{SEVERITY_LABELS[item.severity] || 'Suggestion'}</span>
                <span className="wo-sidebar-item-text">{item.text || item.message}</span>
                <p className="wo-sidebar-item-message">{item.message}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function getFirstTextNode(element) {
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return node
    for (const child of node.childNodes) {
      const found = walk(child)
      if (found) return found
    }
    return null
  }
  return walk(element)
}
