const DAILY_CAP  = 600
const SCAN_KEY   = 'fittrack_scans'
const ANON_KEY   = 'sb_publishable_8g5OMOHCxhWTTAzvP4On4A_TC-sh19O'
const FN_URL     = 'https://ahecfusgkzzjpbxgvjmh.supabase.co/functions/v1/analyze-food'

function today() {
  return new Date().toISOString().split('T')[0]
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

async function post(body) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30000)
  try {
    const res = await fetch(FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error || `Error ${res.status}`)
    return data
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Request timed out — try again')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

export async function analyzeFood(file) {
  if (scansRemaining() <= 0) throw new Error('Daily limit reached — resets at midnight')
  const imageBase64 = await fileToBase64(file)
  const data = await post({ imageBase64, mimeType: file.type || 'image/jpeg' })
  incrementScans()
  return data // {description, calories, protein, carbs, fat, questions:[]}
}

export async function refineFood(description, initialMacros, answers) {
  if (scansRemaining() <= 0) throw new Error('Daily limit reached — resets at midnight')
  const data = await post({ mode: 'refine', description, initialMacros, answers })
  incrementScans()
  return data // {description, calories, protein, carbs, fat}
}
