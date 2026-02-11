export default function FeedbackTooltip({ item, anchor, onMouseEnter, onMouseLeave }) {
  const x = anchor.x + 8
  const y = anchor.y + 12
  const severityLabel = (item.severity || 'suggestion').replace(/^./, (c) => c.toUpperCase())
  const categoryLabel = (item.category || 'general').replace(/^./, (c) => c.toUpperCase())

  return (
    <div
      className="wo-feedback-tooltip"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 9999,
      }}
      role="tooltip"
    >
      <div className="wo-tooltip-header">
        <span className={`wo-tooltip-severity wo-severity-${item.severity || 'suggestion'}`}>
          {severityLabel}
        </span>
        <span className="wo-tooltip-category">{categoryLabel}</span>
      </div>
      <p className="wo-tooltip-message">{item.message}</p>
      {item.suggestion && (
        <div className="wo-tooltip-suggestion">
          <span className="wo-tooltip-suggestion-label">Suggestion:</span>
          <p>{item.suggestion}</p>
        </div>
      )}
    </div>
  )
}
