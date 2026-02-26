import { read, utils } from 'xlsx'

/**
 * Extract spreadsheet ID from a Google Sheets URL
 * Supports: docs.google.com/spreadsheets/d/{id}/edit, /view, etc.
 */
export function extractSpreadsheetId(url) {
  const trimmed = url.trim()
  const match = trimmed.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

/**
 * Fetch a public Google Sheet as XLSX (ArrayBuffer)
 * Note: Sheet must be shared as "Anyone with the link can view"
 */
export async function fetchGSheetAsExcel(spreadsheetId) {
  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`
  const res = await fetch(exportUrl)
  if (!res.ok) {
    throw new Error(
      'Could not fetch the spreadsheet. Ensure it is shared as "Anyone with the link can view".'
    )
  }
  return res.arrayBuffer()
}

/**
 * Parse ArrayBuffer as workbook using xlsx
 */
export function parseExcelFile(arrayBuffer) {
  return read(arrayBuffer, { type: 'array' })
}

/**
 * Convert worksheet to 2D array (header: 1 = first row as headers)
 */
export function sheetTo2DArray(worksheet) {
  return utils.sheet_to_json(worksheet, { header: 1, defval: '' })
}

/**
 * Convert 2D array to markdown table
 * First row = headers, rest = data rows
 */
export function arrayToMarkdownTable(rows) {
  if (!rows || rows.length === 0) return ''

  const escapeCell = (cell) => {
    const s = String(cell ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
    return s.trim()
  }

  const headerRow = rows[0].map(escapeCell)
  const headerLine = '| ' + headerRow.join(' | ') + ' |'
  const separator = '| ' + headerRow.map(() => '---').join(' | ') + ' |'

  const dataLines = rows.slice(1).map((row) => {
    const cells = headerRow.map((_, i) => escapeCell(row[i]))
    return '| ' + cells.join(' | ') + ' |'
  })

  return [headerLine, separator, ...dataLines].join('\n')
}
