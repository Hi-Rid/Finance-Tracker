import type {
    NanonetsItem,
    NanonetsField,
    NanonetsTable,
    NanonetsTableCell,
    ParsedReceipt,
    ParsedReceiptItem,
} from './types'

function normalizeResponse(raw: any): NanonetsItem[] {
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw?.result?.[0]?.prediction)) {
        return raw.result[0].prediction
    }
    if (Array.isArray(raw?.prediction)) return raw.prediction
    return []
}

function extractFields(items: NanonetsItem[]) {
    const fields: Record<string, { text: string; score: number }> = {}
    for (const item of items) {
        if (item.type === 'field') {
            const f = item as NanonetsField
            fields[f.label] = {
                text: f.ocr_text || '',
                score: f.score || 0,
            }
        }
    }
    return fields
}

/**
 * Parse angka dari string format Indonesia.
 * - "25.000" → 25000
 * - "25.000,50" → 25000.5
 * - "1.234.567" → 1234567
 * - "25,5" → 25.5
 * - "25.5" → 25.5 (kalo cuma 1 titik + 1-2 digit di akhir)
 */
function parseIndonesianNumber(
    str: string | null | undefined
): number {
    if (!str) return 0

    const cleaned = String(str).trim().replace(/[^\d.,-]/g, '')
    if (!cleaned) return 0

    // Kalo ada koma = format Indonesia (koma = desimal)
    if (cleaned.includes(',')) {
        // Hapus titik (thousand), ganti koma jadi titik (desimal)
        const normalized = cleaned.replace(/\./g, '').replace(',', '.')
        return parseFloat(normalized) || 0
    }

    // Gak ada koma, cek titik
    const dots = cleaned.split('.')

    // Gak ada titik
    if (dots.length === 1) {
        return parseFloat(cleaned) || 0
    }

    // Multiple titik = thousand separator ("1.234.567")
    if (dots.length > 2) {
        return parseFloat(cleaned.replace(/\./g, '')) || 0
    }

    // Cek 1 titik — thousand atau desimal?
    const lastPart = dots[dots.length - 1]

    // Kalo 3 digit di akhir = thousand separator ("25.000" = 25000)
    if (lastPart.length === 3) {
        return parseFloat(cleaned.replace(/\./g, '')) || 0
    }

    // Kalo 1-2 digit = desimal ("25.5" = 25.5)
    return parseFloat(cleaned) || 0
}

function parseTableItems(table: NanonetsTable): ParsedReceiptItem[] {
    const cells = table.cells || []
    const rowsMap = new Map<
        number,
        Record<string, { text: string; score: number }>
    >()

    for (const cell of cells) {
        const c = cell as NanonetsTableCell
        if (!rowsMap.has(c.row)) rowsMap.set(c.row, {})
        rowsMap.get(c.row)![c.label] = {
            text: c.text || '',
            score: c.score || 0,
        }
    }

    const items: ParsedReceiptItem[] = []
    const sortedRows = Array.from(rowsMap.keys()).sort((a, b) => a - b)

    for (const rowNum of sortedRows) {
        const rowCells = rowsMap.get(rowNum)!
        const description = rowCells['Description']?.text?.trim() || ''
        if (!description) continue

        const quantity = parseIndonesianNumber(rowCells['Quantity']?.text) || 1
        const unitPrice = parseIndonesianNumber(rowCells['Price']?.text)
        const lineAmount = parseIndonesianNumber(rowCells['Line_Amount']?.text)
        const total = lineAmount || unitPrice * quantity

        items.push({
            description,
            quantity,
            unitPrice: unitPrice || (quantity > 0 ? total / quantity : 0),
            total,
        })
    }

    return items
}

function parseDateToISO(dateStr: string | null): string | null {
    if (!dateStr) return null

    const cleaned = dateStr.trim()

    const dmyMatch = cleaned.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/)
    if (dmyMatch) {
        let [, day, month, year] = dmyMatch
        if (year.length === 2) year = '20' + year
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    const isoMatch = cleaned.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/)
    if (isoMatch) {
        const [, year, month, day] = isoMatch
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    const parsed = new Date(cleaned)
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]
    }

    return null
}

/**
 * Parse jam dari berbagai format → "HH:MM" (24 jam).
 */
function parseTimeToHHMM(timeStr: string | null): string | null {
    if (!timeStr) return null

    const cleaned = timeStr.trim().toUpperCase()

    const isPM = cleaned.includes('PM')
    const isAM = cleaned.includes('AM')

    const digitsMatch = cleaned.match(/(\d{1,2})[.:](\d{2})(?:[.:](\d{2}))?/)
    if (!digitsMatch) return null

    let [, hh, mm] = digitsMatch
    let hours = parseInt(hh, 10)

    if (isPM && hours < 12) hours += 12
    if (isAM && hours === 12) hours = 0

    if (hours < 0 || hours > 23) return null

    return `${String(hours).padStart(2, '0')}:${mm}`
}

function combineDateAndTime(
    dateISO: string | null,
    timeHHMM: string | null
): string | null {
    if (!dateISO || !timeHHMM) return null
    return `${dateISO}T${timeHHMM}:00+07:00`
}

export function parseReceiptResponse(raw: any): ParsedReceipt {
    const items = normalizeResponse(raw)
    const fields = extractFields(items)

    const table = items.find((i) => i.type === 'table') as
        | NanonetsTable
        | undefined

    const merchant =
        fields['Merchant_Name']?.text?.replace(/\n/g, ' ').trim() || null
    const merchantAddress = fields['Merchant_Address']?.text?.trim() || null
    const merchantPhone = fields['Merchant_Phone']?.text?.trim() || null
    const receiptNumber = fields['Receipt_Number']?.text?.trim() || null
    const currency = fields['Currency']?.text?.trim() || 'IDR'
    const category = fields['Category']?.text?.trim() || null
    const dateISO = parseDateToISO(fields['Date']?.text || null)
    const timeHHMM = parseTimeToHHMM(fields['Time']?.text || null)
    const datetime = combineDateAndTime(dateISO, timeHHMM)

    // Pakai parseIndonesianNumber untuk amount
    const totalAmount = parseIndonesianNumber(fields['Total_Amount']?.text)
    const taxAmount = parseIndonesianNumber(fields['Tax_Amount']?.text)

    const parsedItems = table ? parseTableItems(table) : []

    const itemsSum = parsedItems.reduce((sum, i) => sum + i.total, 0)
    const subtotal =
        itemsSum > 0 ? itemsSum : Math.max(0, totalAmount - taxAmount)

    const keyScores = [
        fields['Merchant_Name']?.score,
        fields['Total_Amount']?.score,
        fields['Date']?.score,
    ].filter((s): s is number => typeof s === 'number')

    const confidence =
        keyScores.length > 0
            ? keyScores.reduce((a, b) => a + b, 0) / keyScores.length
            : 0

    // ============================================================
    // EXTRACT FILE URLs
    // ============================================================
    const source = Array.isArray(raw) ? raw[0] : raw
    const result = raw?.result?.[0]

    const fileUrl: string | null =
        result?.file_url || source?.file_url || raw?.file_url || null

    const filepath: string | null =
        result?.filepath || source?.filepath || raw?.filepath || null

    const signedUrlsMap: Record<string, any> =
        raw?.signed_urls || source?.signed_urls || {}

    const previewEntry = filepath ? signedUrlsMap[filepath] : null
    const rawEntry = fileUrl ? signedUrlsMap[fileUrl] : null

    const signedUrl: string | null =
        previewEntry?.original || rawEntry?.original || null

    const signedUrlLong: string | null =
        previewEntry?.original_with_long_expiry ||
        rawEntry?.original_with_long_expiry ||
        null

    const requestFileId: string | null =
        result?.request_file_id || source?.request_file_id || null

    const previewFileUrl = filepath || fileUrl

    return {
        merchant,
        merchantAddress,
        merchantPhone,
        date: dateISO,
        time: timeHHMM,
        datetime,
        category,
        receiptNumber,
        currency,
        totalAmount,
        taxAmount,
        subtotal,
        items: parsedItems,
        confidence,
        fileUrl: previewFileUrl,
        signedUrl,
        signedUrlLong,
        requestFileId,
        raw,
    }
}