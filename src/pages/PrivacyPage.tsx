import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLocalization } from '../i18n'

const copy = {
  'id-ID': {
    back: 'Kembali ke PocketGo',
    effective: 'Berlaku 21 Juni 2026',
    title: 'Kebijakan Privasi',
    lead: 'PocketGo dirancang agar data finansial tetap berada di bawah kendali pengguna.',
    sections: [
      ['Data yang kami proses', 'Kami memproses email akun, profil dasar, dompet, transaksi, budget, tagihan rutin, tujuan, utang/PayLater, feedback beta, serta informasi teknis terbatas ketika aplikasi mengalami error.'],
      ['Tujuan pemrosesan', 'Data dipakai untuk menyediakan fitur pencatatan, sinkronisasi, Safe to Spend, forecast, insight, keamanan akun, pemulihan layanan, dan peningkatan produk. PocketGo tidak menjual data pengguna dan tidak memakainya untuk iklan tertarget.'],
      ['Penyimpanan', 'Data akun disimpan melalui Supabase dan aplikasi web dihosting melalui Netlify. PocketGo tidak meminta koneksi bank atau kredensial rekening.'],
      ['Keamanan', 'Datamu hanya bisa diakses dari akun PocketGo milikmu. Komunikasi produksi menggunakan HTTPS dan error log disanitasi.'],
      ['Hak pengguna', 'Pengguna dapat memperbarui, mengekspor, membatasi pemrosesan, atau meminta penghapusan akun dan data.'],
      ['Retensi', 'Data disimpan selama akun aktif atau masih diperlukan untuk menyediakan layanan. Feedback dan log teknis dihapus ketika tidak lagi diperlukan.'],
    ],
    contact: 'Untuk permintaan privasi atau keamanan, buat issue tanpa menyertakan data finansial pribadi di',
    contactTitle: 'Kontak',
    note: 'Dokumen ini adalah ringkasan transparansi produk dan bukan pengganti konsultasi hukum profesional.',
  },
  'en-US': {
    back: 'Back to PocketGo',
    effective: 'Effective June 21, 2026',
    title: 'Privacy Policy',
    lead: 'PocketGo is designed to keep financial data under the user’s control.',
    sections: [
      ['Data we process', 'We process account email, basic profile, wallets, transactions, budgets, recurring bills, goals, debt or Buy Now Pay Later records, beta feedback, and limited technical information when the app encounters an error.'],
      ['Why we process data', 'Data is used for tracking, sync, Safe to Spend, forecasts, insights, account security, service recovery, and product improvement. PocketGo does not sell user data or use it for targeted advertising.'],
      ['Storage', 'Account data is stored through Supabase and the web app is hosted through Netlify. PocketGo does not ask for a bank connection or bank credentials.'],
      ['Security', 'Your data can only be accessed from your PocketGo account. Production traffic uses HTTPS and error logs are sanitized.'],
      ['Your rights', 'You can update or export data, request processing restrictions, or request deletion of your account and data.'],
      ['Retention', 'Data is retained while the account is active or while needed to provide the service. Feedback and technical logs are removed when no longer needed.'],
    ],
    contact: 'For privacy or security requests, open an issue without including personal financial data in the',
    contactTitle: 'Contact',
    note: 'This document is a product transparency summary and is not a substitute for professional legal advice.',
  },
}

export function PrivacyPage() {
  const { language } = useLocalization()
  const content = copy[language]
  return (
    <main className="legal-page">
      <article>
        <Link className="legal-back" to="/"><ArrowLeft size={17} /> {content.back}</Link>
        <span className="legal-icon"><ShieldCheck size={25} /></span>
        <p className="eyebrow">{content.effective}</p>
        <h1>{content.title}</h1>
        <p className="legal-lead">{content.lead}</p>
        {content.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}
        <h2>{content.contactTitle}</h2>
        <p>{content.contact} <a href="https://github.com/KeyzoDev/PocketGo/issues" target="_blank" rel="noreferrer">PocketGo repository</a>.</p>
        <p className="legal-note">{content.note}</p>
      </article>
    </main>
  )
}
