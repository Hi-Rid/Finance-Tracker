export type ExchangeOption = {
    value: string
    label: string
    suffix?: string
}

export const EXCHANGES: ExchangeOption[] = [
    { value: 'IDX', label: 'IDX (Indonesia)', suffix: '.JK' },
    { value: 'NYSE', label: 'NYSE (US)', suffix: '' },
    { value: 'NASDAQ', label: 'NASDAQ (US)', suffix: '' },
    { value: 'AMEX', label: 'AMEX (US)', suffix: '' },
    { value: 'SGX', label: 'SGX (Singapore)', suffix: '.SI' },
    { value: 'HKEX', label: 'HKEX (Hong Kong)', suffix: '.HK' },
    { value: 'TSE', label: 'TSE (Tokyo)', suffix: '.T' },
    { value: 'LSE', label: 'LSE (London)', suffix: '.L' },
]