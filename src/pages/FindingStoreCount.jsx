import { useState, useMemo } from 'react'
import {
  FileJson, Play, Trash2, Copy, CheckCircle2, XCircle,
  Store, UserMinus, UserPlus, FileCode2, Calendar, ChevronDown, ChevronUp,
} from 'lucide-react'
import { parseStoreCount } from '../utils/parseStoreCount'
import { buildStoreCountQueryString } from '../utils/buildStoreCountQuery'
import './FindingStoreCount.css'

const PLACEHOLDER_TEXT = 'Paste your Elasticsearch aggregation response here…\n\nExpects aggregations.time_buckets.buckets with current_month and previous_month, each containing unique_stores.buckets.'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getYearOptions() {
  const current = new Date().getFullYear()
  return [current - 2, current - 1, current, current + 1]
}

function StoreCountCard({
  type,
  label,
  count,
  storeIds,
  icon,
  expanded,
  onToggle,
  onCopyIds,
  idsCopied,
}) {
  return (
    <div className={`store-count-card store-count-card-${type} ${expanded ? 'store-count-card-expanded' : ''}`}>
      <button
        type="button"
        className="store-count-card-head"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${label}: ${count} stores. Click to ${expanded ? 'collapse' : 'show'} store IDs`}
      >
        <div className="store-count-card-icon">{icon}</div>
        <span className="store-count-card-label">{label}</span>
        <span className="store-count-card-value">{count}</span>
        {expanded ? <ChevronUp size={18} className="store-count-card-chevron" /> : <ChevronDown size={18} className="store-count-card-chevron" />}
      </button>
      {expanded && (
        <div className="store-count-card-body">
          <div className="store-count-id-list-wrap">
            <pre className="store-count-id-list">
              {storeIds.length ? storeIds.map((id) => String(id).trim()).join('\n') : '—'}
            </pre>
          </div>
          <button
            type="button"
            className="store-count-copy-btn store-count-copy-ids-btn"
            onClick={(e) => { e.stopPropagation(); onCopyIds() }}
            disabled={storeIds.length === 0}
            title="Copy all store IDs (one per line)"
          >
            {idsCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            {idsCopied ? 'Copied' : 'Copy all IDs'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function FindingStoreCount() {
  const now = new Date()
  const [queryMonth, setQueryMonth] = useState(now.getMonth() + 1) // 1-based
  const [queryYear, setQueryYear] = useState(now.getFullYear())
  const [rawInput, setRawInput] = useState('')
  const [result, setResult] = useState(null)
  const [parsed, setParsed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [queryCopied, setQueryCopied] = useState(false)
  const [expandedCard, setExpandedCard] = useState(null) // 'active' | 'churned' | 'new' | null
  const [idsCopied, setIdsCopied] = useState(null) // which list copy was clicked

  const queryString = useMemo(
    () => buildStoreCountQueryString({ year: queryYear, month: queryMonth }),
    [queryYear, queryMonth],
  )

  const handleParse = () => {
    if (!rawInput.trim()) return
    const out = parseStoreCount(rawInput)
    setResult(out)
    setParsed(true)
  }

  const handleClear = () => {
    setRawInput('')
    setResult(null)
    setParsed(false)
    setCopied(false)
    setExpandedCard(null)
    setIdsCopied(null)
  }

  const idsToText = (ids) => (Array.isArray(ids) ? ids.map((id) => String(id).trim()).filter(Boolean).join('\n') : '')

  const copyStoreIds = (ids, key) => {
    const text = idsToText(ids)
    if (!text) return
    navigator.clipboard.writeText(text)
    setIdsCopied(key)
    setTimeout(() => setIdsCopied(null), 2000)
  }

  const toggleCard = (key) => {
    setExpandedCard((prev) => (prev === key ? null : key))
  }

  const formatOutput = () => {
    if (!result || result.error) return ''
    const { activeCount, churnedCount, newCount } = result
    return `Active Stores (${activeCount}), Churned Stores (${churnedCount}), New Stores (${newCount})`
  }

  const copyOutput = () => {
    const text = formatOutput()
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyQuery = () => {
    navigator.clipboard.writeText(queryString)
    setQueryCopied(true)
    setTimeout(() => setQueryCopied(false), 2000)
  }

  return (
    <div className="store-count-page">
      {/* Query Templates */}
      <div className="query-templates-section">
        <div className="section-header">
          <div className="section-icon query-templates-icon">
            <FileCode2 size={22} />
          </div>
          <div>
            <h2 className="section-title">Query Templates</h2>
            <p className="section-desc">
              Build the Elasticsearch query, then run it and paste the response below to get store counts.
            </p>
          </div>
        </div>

        <div className="query-template-card">
          <div className="query-template-header">
            <span className="query-template-name">Store count (Active / Churned / New)</span>
            <div className="query-template-controls">
              <div className="month-year-row">
                <Calendar size={16} className="month-year-icon" />
                <label className="month-year-label">Current month</label>
                <select
                  className="month-select"
                  value={queryMonth}
                  onChange={(e) => setQueryMonth(Number(e.target.value))}
                  aria-label="Month"
                >
                  {MONTHS.map((name, i) => (
                    <option key={name} value={i + 1}>{name}</option>
                  ))}
                </select>
                <select
                  className="year-select"
                  value={queryYear}
                  onChange={(e) => setQueryYear(Number(e.target.value))}
                  aria-label="Year"
                >
                  {getYearOptions().map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="query-output-wrap">
            <pre className="query-output-pre"><code>{queryString}</code></pre>
            <button
              type="button"
              className="store-count-copy-btn query-copy-btn"
              onClick={copyQuery}
              title="Copy full query"
            >
              {queryCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              {queryCopied ? 'Copied' : 'Copy query'}
            </button>
          </div>
        </div>
      </div>

      {/* Parse response */}
      <div className={`input-section ${parsed ? 'input-section-collapsed' : ''}`}>
        <div className="section-header">
          <div className="section-icon store-count-icon">
            <FileJson size={22} />
          </div>
          <div>
            <h2 className="section-title">Parse response</h2>
            <p className="section-desc">
              Paste Elasticsearch output with time_buckets (current_month vs previous_month). Get Active, Churned, and New store counts.
            </p>
          </div>
        </div>

        <div className="textarea-wrapper">
          <textarea
            className="raw-input"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={PLACEHOLDER_TEXT}
            rows={parsed ? 4 : 12}
          />
          <div className="textarea-footer">
            <span className="char-count">{rawInput.length.toLocaleString()} characters</span>
          </div>
        </div>

        <div className="action-bar">
          <button className="btn btn-primary" onClick={handleParse} disabled={!rawInput.trim()}>
            <Play size={16} />
            Parse
          </button>
          <button className="btn btn-ghost" onClick={handleClear} disabled={!rawInput.trim() && !parsed}>
            <Trash2 size={16} />
            Clear
          </button>
        </div>
      </div>

      {parsed && (
        <div className="store-count-results">
          {result?.error ? (
            <div className="store-count-error">
              <XCircle size={32} />
              <p>{result.error}</p>
            </div>
          ) : (
            <>
              <div className="store-count-cards">
                <StoreCountCard
                  type="active"
                  label="Active Stores"
                  count={result?.activeCount ?? 0}
                  storeIds={result?.activeStoreIds ?? []}
                  icon={<Store size={20} />}
                  expanded={expandedCard === 'active'}
                  onToggle={() => toggleCard('active')}
                  onCopyIds={() => copyStoreIds(result?.activeStoreIds ?? [], 'active')}
                  idsCopied={idsCopied === 'active'}
                />
                <StoreCountCard
                  type="churned"
                  label="Churned Stores"
                  count={result?.churnedCount ?? 0}
                  storeIds={result?.churnedStoreIds ?? []}
                  icon={<UserMinus size={20} />}
                  expanded={expandedCard === 'churned'}
                  onToggle={() => toggleCard('churned')}
                  onCopyIds={() => copyStoreIds(result?.churnedStoreIds ?? [], 'churned')}
                  idsCopied={idsCopied === 'churned'}
                />
                <StoreCountCard
                  type="new"
                  label="New Stores"
                  count={result?.newCount ?? 0}
                  storeIds={result?.newStoreIds ?? []}
                  icon={<UserPlus size={20} />}
                  expanded={expandedCard === 'new'}
                  onToggle={() => toggleCard('new')}
                  onCopyIds={() => copyStoreIds(result?.newStoreIds ?? [], 'new')}
                  idsCopied={idsCopied === 'new'}
                />
              </div>

              <div className="store-count-output-row">
                <code className="store-count-output-text">{formatOutput()}</code>
                <button
                  type="button"
                  className="store-count-copy-btn"
                  onClick={copyOutput}
                  title="Copy formatted line"
                >
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
