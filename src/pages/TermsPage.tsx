import { ArrowLeft, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'

export function TermsPage() {
  return (
    <main className="legal-page">
      <article>
        <Link className="legal-back" to="/"><ArrowLeft size={17} /> Kembali ke PocketGo</Link>
        <span className="legal-icon"><Scale size={25} /></span>
        <p className="eyebrow">Berlaku 21 Juni 2026</p>
        <h1>Ketentuan Penggunaan</h1>
        <p className="legal-lead">Ketentuan ini mengatur penggunaan PocketGo sebagai alat bantu pencatatan dan perencanaan finansial pribadi.</p>

        <h2>Bukan nasihat finansial</h2>
        <p>Safe to Spend, forecast, health score, dan insight adalah perkiraan berdasarkan data yang pengguna masukkan. Fitur tersebut bukan rekomendasi investasi, kredit, pajak, hukum, atau keputusan finansial profesional.</p>

        <h2>Tanggung jawab pengguna</h2>
        <p>Pengguna bertanggung jawab menjaga keamanan akun, memastikan data yang dicatat benar, meninjau asumsi perhitungan, dan memverifikasi kewajiban dengan penyedia layanan keuangan terkait.</p>

        <h2>Penggunaan yang diperbolehkan</h2>
        <p>PocketGo digunakan untuk kebutuhan finansial pribadi atau usaha kecil yang sah. Pengguna tidak boleh mencoba mengakses akun lain, mengganggu layanan, mengeksploitasi celah keamanan, atau memakai layanan untuk aktivitas melanggar hukum.</p>

        <h2>Ketersediaan dan perubahan</h2>
        <p>Kami berupaya menjaga layanan tetap tersedia dan perhitungan tetap benar, namun tidak menjamin layanan bebas gangguan. Fitur dapat diperbaiki, diubah, atau dihentikan untuk keamanan dan kualitas produk.</p>

        <h2>Data dan penghentian akun</h2>
        <p>Pengguna tetap memiliki kendali atas data yang dimasukkan. Sebelum berhenti menggunakan PocketGo, pengguna disarankan mengekspor data. Penghapusan akun dapat menghapus data secara permanen setelah verifikasi.</p>

        <h2>Batas tanggung jawab</h2>
        <p>Sejauh diizinkan hukum, PocketGo tidak bertanggung jawab atas kerugian yang muncul dari data tidak lengkap, keputusan pengguna, keterlambatan input, atau gangguan layanan pihak ketiga.</p>

        <h2>Kontak dan perubahan ketentuan</h2>
        <p>Masukan dapat disampaikan melalui <a href="https://github.com/KeyzoDev/PocketGo/issues" target="_blank" rel="noreferrer">repository PocketGo</a>. Perubahan material pada ketentuan akan diberi tanggal berlaku baru.</p>
      </article>
    </main>
  )
}
