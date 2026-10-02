import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Kebijakan Privasi — Synmony',
    description:
        'Bagaimana Synmony mengumpulkan, menggunakan, dan melindungi data Anda.',
}

const LAST_UPDATED = '2 Oktober 2026'

export default function PrivacyPage() {
    return (
        <article>
            <header className="mb-10">
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand mb-2">
                    Legal
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                    Kebijakan Privasi
                </h1>
                <p className="text-sm text-muted-foreground">
                    Terakhir diperbarui: {LAST_UPDATED}
                </p>
            </header>

            <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <Section title="Ringkasan">
                    <p>
                        Synmony menyimpan data keuangan Anda untuk membantu Anda mengelola
                        keuangan pribadi. Kami <strong>tidak menjual data Anda</strong>,{' '}
                        <strong>tidak menggunakannya untuk iklan</strong>, dan{' '}
                        <strong>tidak membagikannya kepada pihak ketiga</strong> kecuali yang
                        dijelaskan dalam dokumen ini untuk menjalankan fitur yang Anda gunakan
                        sendiri.
                    </p>
                    <p>
                        Anda memiliki kendali penuh atas data Anda: dapat{' '}
                        <strong>mengekspor</strong> seluruh data kapan saja, dan{' '}
                        <strong>menghapus akun</strong> secara permanen kapan saja.
                    </p>
                </Section>

                <Section title="1. Data yang Kami Kumpulkan">
                    <p className="font-semibold text-slate-900 dark:text-white">
                        1.1 Data yang Anda berikan secara langsung
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Alamat email dan kata sandi (kata sandi di-hash, tidak dapat kami baca)</li>
                        <li>PIN pengunci (di-hash dengan SHA-256, hanya untuk mengunci tampilan)</li>
                        <li>Data profil: nama, foto profil (opsional)</li>
                        <li>Data keuangan: transaksi, akun, anggaran, tujuan, investasi, utang, dan wishlist</li>
                        <li>Gambar struk/nota yang Anda pindai beserta hasil pemrosesan teks</li>
                    </ul>

                    <p className="font-semibold text-slate-900 dark:text-white mt-5">
                        1.2 Data yang dikumpulkan secara otomatis
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Catatan akses (untuk keamanan dan pemecahan masalah teknis)</li>
                        <li>Catatan audit perubahan data (untuk Anda melihat riwayat sendiri)</li>
                        <li>Metadata teknis: waktu masuk, jenis perangkat, dan alamat IP</li>
                    </ul>
                </Section>

                <Section title="2. Bagaimana Data Anda Digunakan">
                    <p>Data keuangan Anda digunakan hanya untuk:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Menampilkan data kembali kepada Anda (dasbor, riwayat, laporan)</li>
                        <li>Menghitung proyeksi dan analisis (anggaran, arus kas, kebebasan finansial)</li>
                        <li>Menjalankan fitur AI yang Anda aktifkan sendiri (Auto-Budgeting, Financial Advisor)</li>
                        <li>Mengirim email penting (verifikasi akun, reset kata sandi)</li>
                        <li>Mendeteksi masalah teknis dan menjaga keamanan akun</li>
                    </ul>
                    <p className="mt-3">
                        Kami <strong>tidak menggunakan</strong> data Anda untuk iklan,
                        profiling komersial, atau kepentingan lain di luar layanan Synmony.
                    </p>
                </Section>

                <Section title="3. Kapan Data Dibagikan kepada Pihak Ketiga">
                    <p className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 px-4 py-3">
                        <strong>Kami tidak pernah menjual data Anda.</strong> Namun beberapa
                        kategori pihak ketiga <em>menerima sebagian data</em> untuk
                        menjalankan fitur tertentu.
                    </p>

                    <div className="space-y-3 mt-4">
                        <VendorBlock
                            name="Penyedia Infrastruktur Cloud"
                            purpose="Menyimpan basis data, berkas, dan autentikasi"
                            data="Seluruh data Anda tersimpan di sini, terenkripsi"
                        />
                        <VendorBlock
                            name="Penyedia Layanan AI"
                            purpose="Untuk fitur analisis dan alokasi anggaran otomatis"
                            data="Agregat data keuangan (bukan rincian transaksi mentah). Dikirim hanya saat Anda menekan tombol analisis."
                        />
                        <VendorBlock
                            name="Penyedia Layanan OCR"
                            purpose="Membaca teks dari struk yang Anda pindai"
                            data="Gambar struk yang Anda unggah"
                        />
                        <VendorBlock
                            name="Penyedia Data Pasar"
                            purpose="Harga saham dan kripto secara waktu nyata"
                            data="Hanya simbol ticker (contoh: BBCA). Tidak ada data pribadi Anda."
                        />
                        <VendorBlock
                            name="Penyedia Email Transaksional"
                            purpose="Mengirim email verifikasi dan reset kata sandi"
                            data="Hanya alamat email Anda"
                        />
                        <VendorBlock
                            name="Penyedia Hosting"
                            purpose="Menjalankan aplikasi dan memproses permintaan"
                            data="Catatan teknis permintaan (IP, user agent) untuk keamanan"
                        />
                    </div>

                    <p className="mt-4">
                        Seluruh pihak ketiga di atas <strong>terikat perjanjian data</strong>{' '}
                        dan tidak diperbolehkan menggunakan data Anda untuk kepentingan lain.
                    </p>
                </Section>

                <Section title="4. Hal yang Tidak Kami Lakukan">
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>❌ Tidak menjual data Anda kepada siapa pun</li>
                        <li>❌ Tidak menggunakan data Anda untuk iklan atau profiling komersial</li>
                        <li>❌ Tidak membagikan data ke pihak ketiga selain yang tercantum di atas</li>
                        <li>❌ Tidak mengakses data keuangan Anda untuk kepentingan lain</li>
                        <li>❌ Tidak menggunakan AI untuk mempelajari data Anda demi kepentingan pihak lain</li>
                    </ul>
                </Section>

                <Section title="5. Keamanan Data">
                    <p>
                        Data Anda dilindungi dengan <strong>Row Level Security (RLS)</strong>{' '}
                        pada tingkat basis data — artinya pengguna lain secara teknis{' '}
                        <strong>tidak dapat</strong> mengakses data Anda, meskipun mereka
                        mengetahui URL atau ID-nya.
                    </p>
                    <p>
                        Kata sandi dan PIN di-hash (tidak disimpan dalam bentuk teks biasa).
                        Komunikasi ke server menggunakan HTTPS. Kunci akses administrator
                        hanya digunakan di server dan tidak pernah terekspos ke peramban.
                    </p>
                </Section>

                <Section title="6. Hak Anda">
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>
                            <strong>Akses dan ekspor data:</strong> melalui Pengaturan → Data →
                            Ekspor. Anda akan menerima seluruh data dalam format JSON.
                        </li>
                        <li>
                            <strong>Menghapus akun:</strong> melalui Pengaturan → Data → Hapus
                            akun. Seluruh data Anda (termasuk berkas di penyimpanan) akan
                            dihapus secara permanen.
                        </li>
                        <li>
                            <strong>Memperbaiki data:</strong> seluruh data dapat Anda ubah
                            sendiri melalui aplikasi.
                        </li>
                        <li>
                            <strong>Menonaktifkan fitur AI:</strong> melalui Pengaturan → Data,
                            tersedia opsi untuk menonaktifkan seluruh fitur AI apabila Anda
                            tidak ingin data dikirim ke penyedia layanan AI.
                        </li>
                    </ul>
                </Section>

                <Section title="7. Berapa Lama Data Disimpan">
                    <p>
                        Data Anda disimpan selama akun aktif. Apabila Anda menghapus akun,
                        seluruh data akan dihapus dalam <strong>30 hari</strong> secara
                        permanen, tanpa pemulihan cadangan kecuali cadangan milik penyedia
                        hosting yang memiliki kebijakan retensi sendiri.
                    </p>
                    <p>
                        Catatan audit yang berusia lebih dari <strong>90 hari</strong> akan
                        dihapus secara otomatis.
                    </p>
                </Section>

                <Section title="8. Pengguna di Bawah Umur">
                    <p>
                        Synmony tidak ditujukan untuk pengguna di bawah usia 17 tahun.
                        Apabila kami mengetahui adanya pengguna di bawah umur, akun tersebut
                        akan dihapus.
                    </p>
                </Section>

                <Section title="9. Perubahan Kebijakan">
                    <p>
                        Apabila kami memperbarui kebijakan ini, kami akan memberitahukan
                        melalui email atau banner di aplikasi. Versi terbaru selalu tersedia
                        di halaman ini.
                    </p>
                </Section>

                <Section title="10. Kontak">
                    <p>
                        Pertanyaan mengenai privasi dapat dikirim ke{' '}
                        <a
                            href="mailto:privacy@synmony.my.id"
                            className="font-semibold text-brand hover:underline"
                        >
                            privacy@synmony.my.id
                        </a>
                    </p>
                </Section>

                <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">Catatan:</strong> Synmony saat
                        ini berada dalam tahap pengembangan (beta). Kebijakan ini dapat
                        berubah sebelum rilis publik. Kami akan memperbarui versi ini
                        apabila terdapat perubahan penting.
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

function VendorBlock({
    name,
    purpose,
    data,
}: {
    name: string
    purpose: string
    data: string
}) {
    return (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
            <p className="font-bold text-slate-900 dark:text-white mb-1.5">{name}</p>
            <p className="text-xs text-muted-foreground mb-2">{purpose}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
                <strong className="font-semibold">Data yang dikirim:</strong> {data}
            </p>
        </div>
    )
}