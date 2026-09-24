// =====================================================
// Nanonets Raw Response Types
// =====================================================

export type NanonetsField = {
    id: string
    label: string
    ocr_text: string
    score: number
    type: 'field'
    xmin?: number
    xmax?: number
    ymin?: number
    ymax?: number
}

export type NanonetsTableCell = {
    id: string
    row: number
    col: number
    label: string
    text: string
    score: number
}

export type NanonetsTable = {
    id: string
    label: string
    type: 'table'
    cells: NanonetsTableCell[]
}

export type NanonetsItem = NanonetsField | NanonetsTable

// =====================================================
// Parsed Receipt
// =====================================================

export type ParsedReceiptItem = {
    description: string
    quantity: number
    unitPrice: number
    total: number
}

export type ParsedReceipt = {
    merchant: string | null
    merchantAddress: string | null
    merchantPhone: string | null
    date: string | null
    time: string | null
    datetime: string | null // ISO combined dari date + time
    category: string | null // nama kategori/pocket dari struk
    receiptNumber: string | null
    currency: string
    totalAmount: number
    taxAmount: number
    subtotal: number
    items: ParsedReceiptItem[]
    confidence: number
    fileUrl: string | null
    signedUrl: string | null
    signedUrlLong: string | null
    requestFileId: string | null
    raw: any
}