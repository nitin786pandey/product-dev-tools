const DEFAULT_BASE_URL = 'https://api.mulerouter.ai/vendors/openai/v1'
const DEFAULT_MODEL = 'qwen-plus'

const WRITING_TYPE_PROMPTS = {
  general: 'You are a supportive writing coach. Analyze the text for clarity, economy, structure, tone, correctness, and strength. Be constructive and educational.',
  essay: 'You are a writing coach specializing in academic and formal essays. Focus on argument clarity, evidence use, transitions, and appropriate formality. Help the writer strengthen their thesis and supporting structure.',
  email: 'You are a professional email coach. Focus on clarity, concision, tone appropriateness (formal/casual balance), and call-to-action clarity. Emails should be scannable and purposeful.',
  blog: 'You are a blog and content writing coach. Focus on engagement, readability, punchy openings, varied sentence length, and a conversational yet authoritative tone. Suggest improvements for hooks and structure.',
  technical: 'You are a technical writing coach. Focus on precision, clarity of instructions, consistent terminology, and logical flow. Technical writing should be unambiguous and easy to follow.',
}

const BASE_SYSTEM = `You are an expert writing coach. Analyze the provided text and return feedback as a JSON object.

Feedback taxonomy:
- clarity: ambiguous, convoluted, unclear antecedent
- economy: verbose, redundant, filler words
- structure: paragraph too long, missing transition, weak opening
- tone: too formal/casual, inconsistent register
- correctness: grammar, punctuation
- strength: passive voice, weak verbs, hedging language

Severity levels: error, warning, suggestion, praise

For each feedback item, provide:
- text: the exact span of text (copy it character-for-character from the input)
- category: one of clarity, economy, structure, tone, correctness, strength
- severity: error, warning, suggestion, or praise
- message: brief explanation of the issue (for praise: what works well)
- suggestion: one concrete way to fix or improve (for praise: optional affirmation)

Return ONLY valid JSON in this format, no other text:
{"feedback":[{"text":"exact span","category":"...","severity":"...","message":"...","suggestion":"..."}]}

If there is no feedback, return: {"feedback":[]}

Be selective — flag only the most impactful issues. Include at least one praise when the writing has strengths.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.LLM_API_KEY || process.env.QWEN_API_KEY
  const baseUrl = process.env.LLM_BASE_URL || process.env.QWEN_BASE_URL || DEFAULT_BASE_URL
  const model = process.env.LLM_MODEL || process.env.QWEN_MODEL || DEFAULT_MODEL

  if (!apiKey) {
    return res.status(500).json({ error: 'LLM_API_KEY is not configured' })
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const { content, writingType = 'general', documentSummary } = body
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'content (string) is required' })
  }

  const typePrompt = WRITING_TYPE_PROMPTS[writingType] || WRITING_TYPE_PROMPTS.general
  const systemPrompt = `${BASE_SYSTEM}\n\n${typePrompt}`

  const userContent = documentSummary
    ? `Document context: ${documentSummary}\n\nText to analyze:\n${content}`
    : content

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ]

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
  const llmBody = {
    model,
    messages,
    max_tokens: 2048,
    temperature: 0.3,
  }

  try {
    const llmRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(llmBody),
    })

    if (!llmRes.ok) {
      const errText = await llmRes.text()
      return res.status(502).json({ error: `LLM API error: ${errText}` })
    }

    const data = await llmRes.json()
    const rawContent = data.choices?.[0]?.message?.content
    if (!rawContent) {
      return res.status(502).json({ error: 'No content in LLM response' })
    }

    let text = rawContent.trim()
    const codeBlock = /^```(?:json)?\s*([\s\S]*?)```\s*$/m
    const match = text.match(codeBlock)
    if (match) text = match[1].trim()

    const parsed = JSON.parse(text)
    const feedback = Array.isArray(parsed.feedback) ? parsed.feedback : []

    // Map text spans to start/end positions in content
    const feedbackWithPositions = feedback.map((item) => {
      const text = item.text || ''
      const idx = content.indexOf(text)
      const start = idx >= 0 ? idx : 0
      const end = idx >= 0 ? idx + text.length : 0
      return {
        ...item,
        start,
        end,
      }
    })

    return res.status(200).json({ feedback: feedbackWithPositions })
  } catch (err) {
    console.error('Overseer analyze error:', err)
    return res.status(500).json({ error: err.message || 'Analysis failed' })
  }
}
