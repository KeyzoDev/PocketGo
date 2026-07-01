export type OcrResult = {
  rawText: string
  confidence?: number
  provider: string
}

export class OcrError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

async function runGoogleVision(fileBuffer: Uint8Array): Promise<OcrResult> {
  const apiKey = Deno.env.get('OCR_API_KEY')
  if (!apiKey) throw new OcrError('OCR_NOT_CONFIGURED', 'OCR_API_KEY is not configured.')
  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { content: bytesToBase64(fileBuffer) },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
      }],
    }),
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new OcrError('OCR_PROVIDER_FAILED', payload?.error?.message ?? 'Google Vision OCR failed.')
  }
  const annotation = payload?.responses?.[0]?.fullTextAnnotation
  const rawText = annotation?.text ?? payload?.responses?.[0]?.textAnnotations?.[0]?.description ?? ''
  if (!rawText.trim()) throw new OcrError('OCR_NO_TEXT', 'OCR did not return readable text.')
  return { rawText, confidence: 0.86, provider: 'google_vision' }
}

async function runCustomOcr(fileBuffer: Uint8Array, mimeType: string): Promise<OcrResult> {
  const apiUrl = Deno.env.get('OCR_API_URL')
  const apiKey = Deno.env.get('OCR_API_KEY')
  if (!apiUrl || !apiKey) throw new OcrError('OCR_NOT_CONFIGURED', 'OCR_API_URL or OCR_API_KEY is not configured.')
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      mimeType,
      fileBase64: bytesToBase64(fileBuffer),
    }),
  })
  const payload = await response.json()
  if (!response.ok) {
    throw new OcrError('OCR_PROVIDER_FAILED', payload?.error ?? payload?.message ?? 'OCR provider failed.')
  }
  const rawText = payload.rawText ?? payload.text ?? payload.data?.rawText ?? ''
  if (!rawText.trim()) throw new OcrError('OCR_NO_TEXT', 'OCR did not return readable text.')
  return {
    rawText,
    confidence: Number(payload.confidence ?? payload.data?.confidence ?? 0.8),
    provider: payload.provider ?? 'custom',
  }
}

export async function runOcr(fileBuffer: Uint8Array, mimeType: string): Promise<OcrResult> {
  if (Deno.env.get('ENABLE_MOCK_OCR') === 'true') {
    return {
      rawText: [
        'Nasi Padang Sederhana',
        '29/06/2026',
        'Nasi Padang 1 Rp 28.000',
        'TOTAL Rp 28.000',
      ].join('\n'),
      confidence: 0.9,
      provider: 'mock',
    }
  }

  const provider = (Deno.env.get('OCR_PROVIDER') ?? '').toLowerCase()
  if (!provider) throw new OcrError('OCR_NOT_CONFIGURED', 'OCR_PROVIDER is not configured.')
  if (provider === 'google_vision' || provider === 'google') {
    if (mimeType === 'application/pdf') {
      throw new OcrError('OCR_UNSUPPORTED_FILE', 'PDF OCR requires a custom OCR_API_URL provider.')
    }
    return runGoogleVision(fileBuffer)
  }
  if (Deno.env.get('OCR_API_URL')) return runCustomOcr(fileBuffer, mimeType)
  throw new OcrError('OCR_NOT_CONFIGURED', 'OCR provider is not supported or missing OCR_API_URL.')
}
