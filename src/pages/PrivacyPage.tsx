import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PrivacyPage() {
  return (
    <main className="legal-page">
      <article>
        <Link className="legal-back" to="/"><ArrowLeft size={17} /> Kembali ke PocketGo</Link>
        <span className="legal-icon"><ShieldCheck size={25} /></span>
        <p className="eyebrow">Berlaku 21 Juni 2026</p>
        <h1>Kebijakan Privasi</h1>
        <p className="legal-lead">PocketGo dirancang agar data finansial tetap berada di bawah kendali pengguna.</p>

        <h2>Data yang kami proses</h2>
        <p>Kami memproses email akun, profil dasar, dompet, transaksi, budget, tagihan rutin, tujuan, utang/paylater, feedback beta, serta informasi teknis terbatas ketika aplikasi mengalami error.</p>

        <h2>Tujuan pemrosesan</h2>
        <p>Data dipakai untuk menyediakan fitur pencatatan, sinkronisasi, Safe to Spend, forecast, insight, keamanan akun, pemulihan layanan, dan peningkatan produk. PocketGo tidak menjual data pengguna dan tidak memakainya untuk iklan tertarget.</p>

        <h2>Penyimpanan dan pihak pemroses</h2>
        <p>Data akun disimpan di Supabase. Aplikasi web dihosting melalui Netlify. Kedua layanan tersebut memproses data teknis sesuai kebutuhan penyediaan layanan. PocketGo tidak meminta koneksi bank atau kredensial rekening.</p>

        <h2>Keamanan</h2>
        <p>Setiap tabel milik pengguna dilindungi Row Level Security. Pengguna hanya dapat mengakses baris dengan identitas akunnya. Komunikasi produksi menggunakan HTTPS. Error log disanitasi dan tidak sengaja dirancang untuk merekam nilai transaksi atau catatan finansial.</p>

        <h2>Hak pengguna</h2>
        <p>Pengguna dapat memperbarui data, mengekspor data, meminta pembatasan pemrosesan, menarik persetujuan, atau meminta penghapusan akun dan data. Hak ini sejalan dengan prinsip dalam UU Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.</p>

        <h2>Retensi</h2>
        <p>Data disimpan selama akun aktif atau masih diperlukan untuk menyediakan layanan. Feedback dan log teknis dapat disimpan untuk penanganan masalah, kemudian dihapus ketika tidak lagi diperlukan.</p>

        <h2>Kontak</h2>
        <p>Untuk permintaan privasi atau keamanan, buat issue tanpa menyertakan data finansial pribadi di <a href="https://github.com/KeyzoDev/PocketGo/issues" target="_blank" rel="noreferrer">repository PocketGo</a>. Permintaan yang memerlukan verifikasi identitas akan diarahkan ke kanal privat.</p>

        <p className="legal-note">Dokumen ini adalah ringkasan transparansi produk dan bukan pengganti konsultasi hukum profesional.</p>
      </article>
    </main>
  )
}
