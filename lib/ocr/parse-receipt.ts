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
 * Smart parse angka - deteksi format US vs Indonesian otomatis.
 *
 * Aturan:
 *   - Ada KOMA + TITIK: yang muncul terakhir = desimal
 *     - "1.234,56" (ID) → 1234.56
 *     - "1,234.56" (US) → 1234.56
 *   - Cuma KOMA:
 *     - 3 digit setelah koma → thousand (US): "43,500" → 43500
 *     - 1-2 digit → decimal: "43,5" → 43.5
 *   - Cuma TITIK:
 *     - 3 digit setelah titik → thousand (ID): "43.500" → 43500
 *     - 1-2 digit → decimal: "43.5" → 43.5
 *   - Cuma angka: parse direct
 */
function parseNumberSmart(str: string | null | undefined): number {
    if (!str) return 0

    const cleaned = String(str).trim().replace(/[^\d.,-]/g, '')
    if (!cleaned) return 0

    const hasComma = cleaned.includes(',')
    const hasDot = cleaned.includes('.')

    // ============ Case 1: ADA KOMA + TITIK ============
    if (hasComma && hasDot) {
        const lastComma = cleaned.lastIndexOf(',')
        const lastDot = cleaned.lastIndexOf('.')

        if (lastComma > lastDot) {
            // Indonesian: titik = thousand, koma = decimal
            // "1.234,56" → "1234.56"
            const normalized = cleaned.replace(/\./g, '').replace(',', '.')
            return parseFloat(normalized) || 0
        } else {
            // US: koma = thousand, titik = decimal
            // "1,234.56" → "1234.56"
            const normalized = cleaned.replace(/,/g, '')
            return parseFloat(normalized) || 0
        }
    }

    // ============ Case 2: CUMA KOMA ============
    if (hasComma) {
        const parts = cleaned.split(',')
        const lastPart = parts[parts.length - 1]

        // Multiple koma → thousand separator ("1,234,567")
        if (parts.length > 2) {
            return parseFloat(cleaned.replace(/,/g, '')) || 0
        }

        // 3 digit setelah koma → thousand (US) "43,500" → 43500
        // 1-2 digit → decimal "43,5" → 43.5
        if (lastPart.length === 3) {
            return parseFloat(cleaned.replace(/,/g, '')) || 0
        }
        return parseFloat(cleaned.replace(',', '.')) || 0
    }

    // ============ Case 3: CUMA TITIK ============
    if (hasDot) {
        const parts = cleaned.split('.')
        const lastPart = parts[parts.length - 1]

        // Multiple titik → thousand separator ("1.234.567")
        if (parts.length > 2) {
            return parseFloat(cleaned.replace(/\./g, '')) || 0
        }

        // 3 digit setelah titik → thousand (ID) "43.500" → 43500
        // 1-2 digit → decimal "43.5" → 43.5
        if (lastPart.length === 3) {
            return parseFloat(cleaned.replace(/\./g, '')) || 0
        }
        return parseFloat(cleaned) || 0
    }

    // ============ Case 4: CUMA ANGKA ============
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

        const quantity = parseNumberSmart(rowCells['Quantity']?.text) || 1
        const unitPrice = parseNumberSmart(rowCells['Price']?.text)
        const lineAmount = parseNumberSmart(rowCells['Line_Amount']?.text)
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

    // DD-MM-YYYY atau DD/MM/YYYY (Indonesian)
    const dmyMatch = cleaned.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/)
    if (dmyMatch) {
        let [, day, month, year] = dmyMatch
        if (year.length === 2) year = '20' + year
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    // YYYY-MM-DD (ISO)
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

    // ✅ PAKAI SMART PARSER
    const totalAmount = parseNumberSmart(fields['Total_Amount']?.text)
    const taxAmount = parseNumberSmart(fields['Tax_Amount']?.text)

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

    // ============ EXTRACT FILE URLs ============
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