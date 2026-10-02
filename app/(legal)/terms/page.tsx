import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Syarat & Ketentuan — Synmony',
    description: 'Ketentuan penggunaan aplikasi Synmony.',
}

const LAST_UPDATED = '2 Oktober 2026'

export default function TermsPage() {
    return (
        <article>
            <header className="mb-10">
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand mb-2">
                    Legal
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                    Syarat &amp; Ketentuan
                </h1>
                <p className="text-sm text-muted-foreground">
                    Terakhir diperbarui: {LAST_UPDATED}
                </p>
            </header>

            <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <Section title="1. Penerimaan Syarat">
                    <p>
                        Dengan mendaftar dan menggunakan Synmony, Anda menyetujui syarat dan
                        ketentuan ini. Apabila Anda tidak menyetujuinya, mohon untuk tidak
                        menggunakan aplikasi.
                    </p>
                </Section>

                <Section title="2. Deskripsi Layanan">
                    <p>
                        Synmony adalah aplikasi pencatat dan perencana keuangan pribadi.
                        Fitur yang tersedia meliputi pencatatan transaksi, anggaran, tujuan
                        keuangan, utang, pelacakan investasi, wishlist, pembagian tagihan,
                        dan analisis berbasis AI.
                    </p>
                </Section>

                <Section title="3. Bukan Nasihat Keuangan">
                    <p className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-4 py-3.5 text-amber-900 dark:text-amber-200">
                        <strong>Penting:</strong> Seluruh saran, analisis, atau rekomendasi
                        dari Synmony (termasuk yang dihasilkan oleh AI) bersifat{' '}
                        <strong>edukasi semata</strong> dan bukan nasihat keuangan
                        berlisensi. Keputusan keuangan sepenuhnya menjadi tanggung jawab
                        Anda. Untuk keputusan besar, konsultasikan dengan perencana keuangan
                        profesional.
                    </p>
                </Section>

                <Section title="4. Akun Anda">
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Anda harus berusia minimal 17 tahun untuk menggunakan Synmony</li>
                        <li>Jaga kerahasiaan kata sandi dan PIN Anda</li>
                        <li>Seluruh aktivitas pada akun Anda menjadi tanggung jawab Anda</li>
                        <li>Apabila terdapat aktivitas mencurigakan, segera laporkan kepada kami</li>
                        <li>Dilarang membagikan akun kepada orang lain</li>
                    </ul>
                </Section>

                <Section title="5. Aturan Penggunaan">
                    <p className="font-semibold text-slate-900 dark:text-white">
                        Anda <strong>dilarang</strong>:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Mengakses akun atau data milik pengguna lain</li>
                        <li>Melakukan rekayasa balik (reverse engineering) atau mengeksploitasi celah keamanan untuk kepentingan pribadi</li>
                        <li>Mengunggah malware, virus, atau konten ilegal</li>
                        <li>Melakukan spam atau penyalahgunaan terhadap endpoint (AI, OCR, dan lain-lain)</li>
                        <li>Menggunakan aplikasi untuk aktivitas ilegal</li>
                    </ul>
                    <p className="mt-3">
                        Apabila ditemukan pelanggaran, akun Anda dapat ditangguhkan atau
                        dihapus tanpa pengembalian dana.
                    </p>
                </Section>

                <Section title="6. Data dan Privasi">
                    <p>
                        Cara kami mengumpulkan dan menggunakan data dijelaskan dalam{' '}
                        <a
                            href="/privacy"
                            className="font-semibold text-brand hover:underline"
                        >
                            Kebijakan Privasi
                        </a>
                        . Dengan menggunakan Synmony, Anda menyetujui kebijakan tersebut.
                    </p>
                </Section>

                <Section title="7. Ketersediaan Layanan">
                    <p>
                        Kami berupaya menjaga aplikasi agar selalu dapat diakses, namun
                        tidak memberikan jaminan ketersediaan 100%. Terdapat kemungkinan
                        gangguan akibat pemeliharaan, pembaruan, atau masalah pada pihak
                        ketiga.
                    </p>
                    <p>
                        Synmony saat ini <strong>gratis</strong> dan berada dalam tahap{' '}
                        <strong>beta</strong>. Fitur dapat berubah tanpa pemberitahuan
                        terlebih dahulu. Apabila di kemudian hari terdapat perubahan ke
                        model berbayar, kami akan memberikan pemberitahuan jauh sebelum
                        perubahan berlaku.
                    </p>
                </Section>

                <Section title="8. Batasan Tanggung Jawab">
                    <p>Synmony disediakan "sebagaimana adanya". Kami tidak bertanggung jawab atas:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Kerugian finansial akibat keputusan yang Anda ambil berdasarkan data di Synmony</li>
                        <li>Kehilangan data akibat keadaan kahar (force majeure) atau masalah pada penyedia layanan</li>
                        <li>Kesalahan perhitungan yang timbul dari data yang Anda masukkan secara keliru</li>
                        <li>Hasil AI yang tidak akurat (AI dapat membuat kesalahan, selalu lakukan verifikasi ulang)</li>
                    </ul>
                </Section>

                <Section title="9. Penghentian Akun">
                    <p>
                        <strong>Dari pihak Anda:</strong> Anda dapat menghapus akun kapan
                        saja melalui Pengaturan → Data.
                    </p>
                    <p>
                        <strong>Dari pihak kami:</strong> Kami dapat menangguhkan atau
                        menghapus akun apabila Anda melanggar syarat ini.
                    </p>
                </Section>

                <Section title="10. Perubahan Syarat">
                    <p>
                        Syarat ini dapat berubah sewaktu-waktu. Perubahan signifikan akan
                        kami beritahukan melalui email atau banner di aplikasi. Penggunaan
                        Synmony secara berkelanjutan setelah pembaruan berarti Anda
                        menyetujui syarat yang baru.
                    </p>
                </Section>

                <Section title="11. Hukum yang Berlaku">
                    <p>
                        Syarat ini tunduk pada hukum Republik Indonesia. Setiap sengketa
                        diselesaikan melalui pengadilan di Indonesia.
                    </p>
                </Section>

                <Section title="12. Kontak">
                    <p>
                        Apabila terdapat pertanyaan, silakan hubungi{' '}
                        <a
                            href="mailto:hello@synmony.my.id"
                            className="font-semibold text-brand hover:underline"
                        >
                            hello@synmony.my.id
                        </a>
                    </p>
                </Section>

                <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">Catatan:</strong> Synmony saat
                        ini berada dalam tahap beta. Syarat ini dapat berubah sebelum rilis
                        publik.
                    </p>
                </div>
            </div>
        </article>
    )
}

function Section({
    title,
    children,
}: {
    title: string
    children: React.ReactNode
}) {
    return (
        <section>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                {title}
            </h2>
            <div className="space-y-3">{children}</div>
        </section>
    )
}