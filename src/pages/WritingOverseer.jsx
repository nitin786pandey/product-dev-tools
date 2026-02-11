import { useState, useRef } from 'react'
import { Power, Loader2 } from 'lucide-react'
import EditorWithFeedback from '../components/overseer/EditorWithFeedback'
import FeedbackSidebar from '../components/overseer/FeedbackSidebar'
import { useOverseerAnalysis } from '../hooks/useOverseerAnalysis'
import { WRITING_TYPES } from '../utils/overseerPrompts'
import './WritingOverseer.css'

export default function WritingOverseer() {
  const [content, setContent] = useState('')
  const [writingType, setWritingType] = useState('general')
  const [overseerEnabled, setOverseerEnabled] = useState(true)
  const containerRef = useRef(null)

  const { feedback, loading, error, analyzedContent } = useOverseerAnalysis(
    content,
    writingType,
    overseerEnabled
  )

  return (
    <div className="wo-page" ref={containerRef}>
      <div className="wo-main">
        <div className="wo-toolbar">
          <div className="wo-toolbar-left">
            <select
              className="wo-writing-type-select"
              value={writingType}
              onChange={(e) => setWritingType(e.target.value)}
              aria-label="Writing type"
            >
              {WRITING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {loading && (
              <span className="wo-loading" aria-hidden>
                <Loader2 size={16} className="wo-spinner" />
                Analyzing...
              </span>
            )}
            {error && (
              <span className="wo-error" role="alert">
                {error}
              </span>
            )}
          </div>
          <div className="wo-toolbar-right">
            <button
              type="button"
              className={`wo-overseer-toggle ${overseerEnabled ? 'on' : 'off'}`}
              onClick={() => setOverseerEnabled((v) => !v)}
              title={overseerEnabled ? 'Turn off overseer' : 'Turn on overseer'}
              aria-pressed={overseerEnabled}
              aria-label={overseerEnabled ? 'Overseer on' : 'Overseer off'}
            >
              <Power size={18} />
              <span>{overseerEnabled ? 'On' : 'Off'}</span>
            </button>
          </div>
        </div>

        <div className="wo-editor-wrap">
          <EditorWithFeedback
            content={content}
            onContentChange={setContent}
            feedback={feedback}
            analyzedContent={analyzedContent}
            placeholder="Start writing... The overseer will analyze your text when you pause."
          />
        </div>
      </div>

      <aside className="wo-aside">
        <FeedbackSidebar
          feedback={feedback}
          containerRef={containerRef}
        />
      </aside>
    </div>
  )
}
