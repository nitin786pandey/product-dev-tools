import { useState, useEffect, useRef, useCallback } from 'react'

const DEBOUNCE_MS = 2500

export function useOverseerAnalysis(content, writingType, enabled) {
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analyzedContent, setAnalyzedContent] = useState('')
  const timeoutRef = useRef(null)
  const abortRef = useRef(null)

  const analyze = useCallback(async () => {
    if (!content.trim() || !enabled) {
      setFeedback([])
      setAnalyzedContent('')
      return
    }

    setLoading(true)
    setError(null)

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const documentSummary = content.length > 500
      ? content.slice(0, 200) + '\n[...]\n' + content.slice(-200)
      : undefined

    try {
      const res = await fetch('/api/overseer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          writingType: writingType || 'general',
          documentSummary,
        }),
        signal: controller.signal,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      setFeedback(data.feedback || [])
      setAnalyzedContent(content)
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || 'Analysis failed')
      setFeedback([])
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [content, writingType, enabled])

  useEffect(() => {
    if (!enabled) {
      setFeedback([])
      setLoading(false)
      setAnalyzedContent('')
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    if (!content.trim()) {
      setFeedback([])
      setAnalyzedContent('')
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      analyze()
    }, DEBOUNCE_MS)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [content, enabled, analyze])

  return { feedback, loading, error, analyzedContent }
}
