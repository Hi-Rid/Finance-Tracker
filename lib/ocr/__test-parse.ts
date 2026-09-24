import { parseReceiptResponse } from './parse-receipt'

// Response asli dari Nanonets (format terbaru)
const sampleResponse = {
    result: [
        {
            id: '221cd1a1-b570-11f1-800a-16175fdeaa59',
            page: 0,
            input: 'images.png',
            message: 'Success',
            file_url:
                'uploadedfiles/af247490-9fc5-4420-a84b-9db028d94543/RawPredictions/4867d1e1-b7ce-4602-9bbf-046d9eac69a8.png',
            filepath:
                'uploadedfiles/af247490-9fc5-4420-a84b-9db028d94543/PredictionImages/e88d4f09-b123-4b1e-a78b-89504a4b668f.jpeg',
            request_file_id: '4867d1e1-b7ce-4602-9bbf-046d9eac69a8',
            prediction: [
                {
                    id: 'edc2e603',
                    type: 'field',
                    label: 'Date',
                    score: 0.71,
                    ocr_text: '2026-03-18',
                },
                {
                    id: 'dfb115a0',
                    type: 'field',
                    label: 'Merchant_Address',
                    score: 0.36,
                    ocr_text: '767 5th Avenue, New York, NY 10153',
                },
                {
                    id: '87ea57ac',
                    type: 'field',
                    label: 'Merchant_Name',
                    score: 0.68,
                    ocr_text: 'Apple Store, Fifth Avenue',
                },
                {
                    id: 'b7ea9f71',
                    type: 'field',
                    label: 'Merchant_Phone',
                    score: 0.9998,
                    ocr_text: '2123361440',
                },
                {
                    id: '704d1375',
                    type: 'field',
                    label: 'Receipt_Number',
                    score: 0.9987,
                    ocr_text: 'AP5AV1124251416',
                },
                {
                    id: 'bb35665e',
                    type: 'field',
                    label: 'Tax_Amount',
                    score: 1,
                    ocr_text: '127.53',
                },
                {
                    id: '2c7ce92f',
                    type: 'field',
                    label: 'Total_Amount',
                    score: 1,
                    ocr_text: '1564.53',
                },
                {
                    id: '64ed4714',
                    type: 'table',
                    label: 'table',
                    cells: [
                        {
                            id: 'c1',
                            row: 1,
                            col: 1,
                            label: 'Description',
                            text: 'iPhone 15 Pro Max 256GB - Natural Titanium Model',
                            score: 0.73,
                        },
                        {
                            id: 'c2',
                            row: 1,
                            col: 2,
                            label: 'Line_Amount',
                            text: '1199.00',
                            score: 0.99,
                        },
                        {
                            id: 'c3',
                            row: 1,
                            col: 3,
                            label: 'Product_Code',
                            text: 'A2849 IMEI 35 728401 992735 7',
                            score: 0.56,
                        },
                        {
                            id: 'c4',
                            row: 2,
                            col: 1,
                            label: 'Description',
                            text: 'AppleCare + for iPhone 15 Pro Max 2 - Year Coverage',
                            score: 0.99,
                        },
                        {
                            id: 'c5',
                            row: 2,
                            col: 2,
                            label: 'Line_Amount',
                            text: '219.00',
                            score: 0.99,
                        },
                        {
                            id: 'c6',
                            row: 3,
                            col: 1,
                            label: 'Description',
                            text: 'USB - C 20W Power Adapter',
                            score: 0.99,
                        },
                        {
                            id: 'c7',
                            row: 3,
                            col: 2,
                            label: 'Line_Amount',
                            text: '19.00',
                            score: 0.99,
                        },
                    ],
                },
            ],
        },
    ],
    message: 'Success',
    signed_urls: {
        'uploadedfiles/af247490-9fc5-4420-a84b-9db028d94543/RawPredictions/4867d1e1-b7ce-4602-9bbf-046d9eac69a8.png':
        {
            original:
                'https://nanonets.s3.us-west-2.amazonaws.com/uploadedfiles/test-original.png?X-Amz-Signature=xxx',
            thumbnail: '',
            original_with_long_expiry:
                'https://nanonets.s3.us-west-2.amazonaws.com/uploadedfiles/test-long.png?X-Amz-Signature=yyy',
        },
        'uploadedfiles/af247490-9fc5-4420-a84b-9db028d94543/PredictionImages/e88d4f09-b123-4b1e-a78b-89504a4b668f.jpeg':
        {
            original: 'https://images.nanonets.com/tr:rt-0,true/test.jpeg?ik-s=zzz',
            thumbnail: 'https://images.nanonets.com/tr:w-240/test.jpeg',
            original_with_long_expiry:
                'https://images.nanonets.com/tr:rt-0/test-long.jpeg',
        },
    },
}

console.log('='.repeat(60))
console.log('TEST PARSER OCR RECEIPT')
console.log('='.repeat(60))

const parsed = parseReceiptResponse(sampleResponse)

console.log('\n📋 HASIL PARSE:\n')
console.log(JSON.stringify(parsed, null, 2))

console.log('\n' + '='.repeat(60))
console.log('✅ SUMMARY')
console.log('='.repeat(60))
console.log(`Merchant      : ${parsed.merchant}`)
console.log(`Date          : ${parsed.date}`)
console.log(`Total         : ${parsed.totalAmount}`)
console.log(`Tax           : ${parsed.taxAmount}`)
console.log(`Items         : ${parsed.items.length}`)
parsed.items.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.description} — ${item.quantity}x @ ${item.unitPrice} = ${item.total}`)
})
console.log(`Confidence    : ${(parsed.confidence * 100).toFixed(1)}%`)
console.log(`fileUrl       : ${parsed.fileUrl}`)
console.log(`signedUrl     : ${parsed.signedUrl}`)
console.log(`signedUrlLong : ${parsed.signedUrlLong}`)
console.log(`requestFileId : ${parsed.requestFileId}`)
console.log('='.repeat(60))