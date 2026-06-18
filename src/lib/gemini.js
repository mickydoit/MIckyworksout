const DAILY_CAP = 10
const SCAN_KEY = 'fittrack_scans'
const API_KEY  = 'fittrack_gemini_key'

function today() {
  return new Date().toISOString().split('T')[0]
}

export function getGeminiKey() {
  return localStorage.getItem(API_KEY) || ''
}

export function setGeminiKey(key) {
  localStorage.setItem(API_KEY, key.trim())
}

export function getScansUsed() {
  try {
    const raw = localStorage.getItem(SCAN_KEY)
    if (!raw) return 0
    const { date, count } = JSON.parse(raw)
    return date === today() ? count : 0
  } catch { return 0 }
}

export function scansRemaining() {
  return Math.max(0, DAILY_CAP - getScansUsed())
}

function incrementScans() {
  localStorage.setItem(SCAN_KEY, JSON.stringify({ date: today(), count: getScansUsed() + 1 }))
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function analyzeFood(file) {
  const key = getGeminiKey()
  if (!key) throw new Error('NO_KEY')
  if (scansRemaining() <= 0) throw new Error('Daily limit reached — resets at midnight')

  const base64 = await fileToBase64(file)

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: file.type || 'image/jpeg', data: base64 } },
            { text: `Analyze this food image. Estimate total nutritional content for everything visible.
Return ONLY valid JSON (no markdown, no explanation):
{"description":"brief meal name","calories":number,"protein":number,"carbs":number,"fat":number}
All values integers. Calories in kcal, macros in grams. Be realistic about portion sizes.` }
          ]
        }],
        generationConfig: { temperature: 0.1 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const match = text.match(/\{[\s\S]*?\}/)
  if (!match) throw new Error('Could not read AI response')

  const result = JSON.parse(match[0])
  if (result.error) throw new Error(result.error)

  incrementScans()
  return result
}
