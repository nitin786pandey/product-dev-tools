import { useState, useMemo } from 'react'
import {
  FileJson, Play, Trash2, Copy, CheckCircle2, XCircle,
  Store, UserMinus, UserPlus, FileCode2, Calendar,
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

export default function FindingStoreCount() {
  const now = new Date()
  const [queryMonth, setQueryMonth] = useState(now.getMonth() + 1) // 1-based
  const [queryYear, setQueryYear] = useState(now.getFullYear())
  const [rawInput, setRawInput] = useState('')
  const [result, setResult] = useState(null)
  const [parsed, setParsed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [queryCopied, setQueryCopied] = useState(false)

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
                <div className="store-count-card store-count-card-active">
                  <div className="store-count-card-icon">
                    <Store size={20} />
                  </div>
                  <span className="store-count-card-label">Active Stores</span>
                  <span className="store-count-card-value">{result?.activeCount ?? 0}</span>
                </div>
                <div className="store-count-card store-count-card-churned">
                  <div className="store-count-card-icon">
                    <UserMinus size={20} />
                  </div>
                  <span className="store-count-card-label">Churned Stores</span>
                  <span className="store-count-card-value">{result?.churnedCount ?? 0}</span>
                </div>
                <div className="store-count-card store-count-card-new">
                  <div className="store-count-card-icon">
                    <UserPlus size={20} />
                  </div>
                  <span className="store-count-card-label">New Stores</span>
                  <span className="store-count-card-value">{result?.newCount ?? 0}</span>
                </div>
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
