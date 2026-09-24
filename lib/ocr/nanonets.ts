const NANONETS_BASE = 'https://app.nanonets.com'
const TIMEOUT_MS = 30000 // 30 detik

function getAuthHeader(): string {
    const apiKey = process.env.NANONETS_API_KEY
    if (!apiKey) {
        throw new Error('NANONETS_API_KEY belum di-set di .env.local')
    }
    const token = Buffer.from(`${apiKey}:`).toString('base64')
    return `Basic ${token}`
}

function getModelId(): string {
    const modelId = process.env.NANONETS_MODEL_ID
    if (!modelId) {
        throw new Error('NANONETS_MODEL_ID belum di-set di .env.local')
    }
    return modelId
}

/**
 * Upload file ke Nanonets OCR (sync mode).
 * Return raw response — parsing di-handle terpisah.
 */
export async function scanReceiptWithNanonets(file: File | Blob): Promise<any> {
    const modelId = getModelId()
    const formData = new FormData()
    formData.append('file', file)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
        const res = await fetch(
            `${NANONETS_BASE}/api/v2/OCR/Model/${modelId}/LabelFile/?async=false`,
            {
                method: 'POST',
                headers: {
                    Authorization: getAuthHeader(),
                },
                body: formData,
                signal: controller.signal,
            }
        )

        if (!res.ok) {
            const errorText = await res.text()
            throw new Error(
                `Nanonets error ${res.status}: ${errorText || res.statusText}`
            )
        }

        return await res.json()
    } catch (err: any) {
        if (err.name === 'AbortError') {
            throw new Error('OCR timeout (lebih dari 30 detik). Coba lagi.')
        }
        throw err
    } finally {
        clearTimeout(timeoutId)
    }
}