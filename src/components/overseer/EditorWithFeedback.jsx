import { useRef, useEffect, useState, useCallback } from 'react'
import FeedbackTooltip from './FeedbackTooltip'

export default function EditorWithFeedback({
  content,
  onContentChange,
  feedback = [],
  analyzedContent,
  placeholder = 'Start writing...',
  disabled = false,
}) {
  const editorRef = useRef(null)
  const containerRef = useRef(null)
  const overlayRef = useRef(null)
  const [overlayRects, setOverlayRects] = useState([])
  const [hoveredFeedback, setHoveredFeedback] = useState(null)
  const [tooltipAnchor, setTooltipAnchor] = useState(null)

  // Sync content from prop to editor when it changes externally (e.g. clear, load)
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    const current = el.textContent || ''
    if (content !== current) {
      el.textContent = content
    }
  }, [content])

  const handleInput = useCallback(() => {
    const el = editorRef.current
    if (el) onContentChange?.(el.textContent || '')
  }, [onContentChange])

  // Compute overlay positions when feedback or content changes
  useEffect(() => {
    const editor = editorRef.current
    const container = containerRef.current
    if (!editor || !container || !feedback.length || content !== analyzedContent) {
      setOverlayRects([])
      return
    }

    const fullText = editor.textContent || ''
    const containerRect = container.getBoundingClientRect()
    const scrollTop = container.scrollTop
    const scrollLeft = container.scrollLeft

    const rects = feedback
      .filter((f) => f.start >= 0 && f.end <= fullText.length)
      .map((f) => {
        try {
          const startInfo = getTextNodeAndOffset(editor, f.start)
          const endInfo = getTextNodeAndOffset(editor, f.end)
          if (!startInfo.node || !endInfo.node) return null
          const range = document.createRange()
          range.setStart(startInfo.node, startInfo.offset)
          range.setEnd(endInfo.node, endInfo.offset)
          const rect = range.getBoundingClientRect()
          return {
            ...f,
            top: rect.top - containerRect.top + scrollTop,
            left: rect.left - containerRect.left + scrollLeft,
            width: rect.width,
            height: rect.height,
          }
        } catch {
          return null
        }
      })
      .filter(Boolean)

    setOverlayRects(rects)
  }, [feedback, content, analyzedContent])

  const hideTimeoutRef = useRef(null)

  const showTooltip = useCallback((event, item) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setHoveredFeedback(item)
    setTooltipAnchor({ x: event.clientX, y: event.clientY })
  }, [])

  const hideTooltip = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredFeedback(null)
      setTooltipAnchor(null)
      hideTimeoutRef.current = null
    }, 150)
  }, [])

  const keepTooltip = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const showFeedback = feedback.length > 0 && content === analyzedContent

  return (
    <div ref={containerRef} className="wo-editor-container">
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        className="wo-editor"
        onInput={handleInput}
        data-placeholder={placeholder}
        role="textbox"
        aria-placeholder={placeholder}
      />
      {showFeedback && (
        <div ref={overlayRef} className="wo-editor-overlay" aria-hidden>
          {overlayRects.map((item, i) => (
            <span
              key={i}
              className={`wo-feedback-underline wo-feedback-${item.severity || 'suggestion'}`}
              style={{
                position: 'absolute',
                top: item.top,
                left: item.left,
                width: item.width,
                height: item.height,
              }}
              onMouseEnter={(e) => showTooltip(e, item)}
              onMouseLeave={hideTooltip}
            />
          ))}
        </div>
      )}
      {hoveredFeedback && tooltipAnchor && (
        <FeedbackTooltip
          item={hoveredFeedback}
          anchor={tooltipAnchor}
          onMouseEnter={keepTooltip}
          onMouseLeave={hideTooltip}
        />
      )}
    </div>
  )
}

function getTextNodeAndOffset(element, charOffset) {
  let count = 0
  let result = { node: null, offset: 0 }
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length ?? 0
      if (count + len > charOffset) {
        result = { node, offset: charOffset - count }
        return true
      }
      count += len
    }
    for (const child of node.childNodes) {
      if (walk(child)) return true
    }
    return false
  }
  walk(element)
  return result
}

function getTextNode(element) {
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
