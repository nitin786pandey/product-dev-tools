import { useState } from 'react'
import {
  FileJson, Play, Trash2, Copy, CheckCircle2, XCircle,
  Store, UserMinus, UserPlus,
} from 'lucide-react'
import { parseStoreCount } from '../utils/parseStoreCount'
import './FindingStoreCount.css'

const PLACEHOLDER_TEXT = 'Paste your Elasticsearch aggregation response here…\n\nExpects aggregations.time_buckets.buckets with current_month and previous_month, each containing unique_stores.buckets.'

export default function FindingStoreCount() {
  const [rawInput, setRawInput] = useState('')
  const [result, setResult] = useState(null)
  const [parsed, setParsed] = useState(false)
  const [copied, setCopied] = useState(false)

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

  return (
    <div className="store-count-page">
      <div className={`input-section ${parsed ? 'input-section-collapsed' : ''}`}>
        <div className="section-header">
          <div className="section-icon store-count-icon">
            <FileJson size={22} />
          </div>
          <div>
            <h2 className="section-title">Finding Store Count</h2>
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
