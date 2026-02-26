import { useState, useCallback } from 'react'
import {
  Table2, Link2, Upload, FileSpreadsheet, Copy, CheckCircle2,
  Loader2, AlertCircle, RefreshCw
} from 'lucide-react'
import {
  extractSpreadsheetId,
  fetchGSheetAsExcel,
  parseExcelFile,
  sheetTo2DArray,
  arrayToMarkdownTable,
} from '../utils/excelToMarkdown'
import './ExcelToMarkdown.css'

const INPUT_MODES = { gsheet: 'gsheet', upload: 'upload' }

export default function ExcelToMarkdown() {
  const [inputMode, setInputMode] = useState(INPUT_MODES.gsheet)
  const [gsheetUrl, setGsheetUrl] = useState('')
  const [workbook, setWorkbook] = useState(null)
  const [selectedSheet, setSelectedSheet] = useState('')
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const loadFromGSheet = useCallback(async () => {
    const id = extractSpreadsheetId(gsheetUrl)
    if (!id) {
      setError('Invalid Google Sheets URL. Use a link like: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const ab = await fetchGSheetAsExcel(id)
      const wb = parseExcelFile(ab)
      setWorkbook(wb)
      setSelectedSheet(wb.SheetNames[0] || '')
      setMarkdown('')
    } catch (err) {
      setError(err.message || 'Failed to load spreadsheet')
      setWorkbook(null)
    } finally {
      setLoading(false)
    }
  }, [gsheetUrl])

  const loadFromFile = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setLoading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = parseExcelFile(ev.target.result)
        setWorkbook(wb)
        setSelectedSheet(wb.SheetNames[0] || '')
        setMarkdown('')
      } catch (err) {
        setError(err.message || 'Failed to parse file')
        setWorkbook(null)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }, [])

  const convertToMarkdown = useCallback(() => {
    if (!workbook || !selectedSheet) return
    const ws = workbook.Sheets[selectedSheet]
    if (!ws) return
    const rows = sheetTo2DArray(ws)
    setMarkdown(arrayToMarkdownTable(rows))
  }, [workbook, selectedSheet])

  const handleSheetChange = (e) => {
    setSelectedSheet(e.target.value)
    setMarkdown('')
  }

  const copyToClipboard = () => {
    if (!markdown) return
    navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setWorkbook(null)
    setSelectedSheet('')
    setMarkdown('')
    setError(null)
    setGsheetUrl('')
  }

  const hasWorkbook = !!workbook
  const sheetNames = workbook?.SheetNames || []
  const previewRows = selectedSheet && workbook
    ? sheetTo2DArray(workbook.Sheets[selectedSheet]).slice(0, 15)
    : []

  return (
    <div className="excel-md-page">
      <div className="excel-md-input-section">
        <div className="section-header">
          <div className="section-icon excel-md-icon">
            <Table2 size={22} />
          </div>
          <div>
            <h2 className="section-title">Excel / Google Sheets to Markdown</h2>
            <p className="section-desc">
              Paste a Google Sheets link or upload an Excel file, select a sheet, then convert to markdown table format.
            </p>
          </div>
        </div>

        {/* Input mode tabs */}
        <div className="mode-tabs">
          <button
            className={`mode-tab ${inputMode === INPUT_MODES.gsheet ? 'active' : ''}`}
            onClick={() => setInputMode(INPUT_MODES.gsheet)}
          >
            <Link2 size={16} />
            Google Sheets Link
          </button>
          <button
            className={`mode-tab ${inputMode === INPUT_MODES.upload ? 'active' : ''}`}
            onClick={() => setInputMode(INPUT_MODES.upload)}
          >
            <Upload size={16} />
            Upload Excel
          </button>
        </div>

        {inputMode === INPUT_MODES.gsheet && (
          <div className="gsheet-input-row">
            <input
              type="url"
              className="gsheet-input"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={gsheetUrl}
              onChange={(e) => setGsheetUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadFromGSheet()}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={loadFromGSheet}
              disabled={loading || !gsheetUrl.trim()}
            >
              {loading ? <Loader2 size={16} className="spin" /> : <FileSpreadsheet size={16} />}
              {loading ? 'Loading...' : 'Load'}
            </button>
          </div>
        )}

        {inputMode === INPUT_MODES.upload && (
          <div className="upload-zone">
            <input
              type="file"
              id="excel-upload"
              accept=".xlsx,.xls"
              onChange={loadFromFile}
              className="upload-input"
            />
            <label htmlFor="excel-upload" className={`upload-label ${loading ? 'loading' : ''}`}>
              {loading ? <Loader2 size={24} className="spin" /> : <Upload size={24} />}
              {loading ? 'Parsing...' : 'Choose .xlsx or .xls file'}
            </label>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Sheet selector */}
        {hasWorkbook && sheetNames.length > 0 && (
          <div className="sheet-selector">
            <label className="sheet-label">Select sheet</label>
            <div className="sheet-select-row">
              <select
                className="sheet-select"
                value={selectedSheet}
                onChange={handleSheetChange}
              >
                {sheetNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={convertToMarkdown}>
                Convert to Markdown
              </button>
              <button className="btn btn-ghost" onClick={reset} title="Start over">
                <RefreshCw size={16} />
                Reset
              </button>
            </div>

            {previewRows.length > 0 && (
              <div className="sheet-preview">
                <span className="sheet-preview-label">Preview</span>
                <div className="sheet-preview-table-wrap">
                  <table className="sheet-preview-table">
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j}>{String(cell ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Markdown output */}
      {markdown && (
        <div className="excel-md-output">
          <div className="output-header">
            <h3 className="output-title">Markdown</h3>
            <button className="btn btn-primary copy-btn" onClick={copyToClipboard}>
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="markdown-preview">{markdown}</pre>
        </div>
      )}
    </div>
  )
}
