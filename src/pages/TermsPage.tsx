import { ArrowLeft, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLocalization } from '../i18n'

const copy = {
  'id-ID': {
    back: 'Kembali ke PocketGo',
    effective: 'Berlaku 21 Juni 2026',
    title: 'Ketentuan Penggunaan',
    lead: 'Ketentuan ini mengatur penggunaan PocketGo sebagai alat bantu pencatatan dan perencanaan finansial pribadi.',
    sections: [
      ['Bukan nasihat finansial', 'Safe to Spend, forecast, health score, dan insight adalah perkiraan berdasarkan data yang pengguna masukkan dan bukan nasihat investasi, kredit, pajak, hukum, atau finansial profesional.'],
      ['Tanggung jawab pengguna', 'Pengguna bertanggung jawab menjaga keamanan akun, memastikan data benar, meninjau asumsi perhitungan, dan memverifikasi kewajiban dengan penyedia layanan terkait.'],
      ['Penggunaan yang diperbolehkan', 'PocketGo digunakan untuk kebutuhan finansial pribadi atau usaha kecil yang sah. Pengguna tidak boleh mengakses akun lain, mengganggu layanan, mengeksploitasi celah, atau melakukan aktivitas melanggar hukum.'],
      ['Ketersediaan', 'Kami berupaya menjaga layanan dan perhitungan tetap benar, tetapi tidak menjamin layanan bebas gangguan. Fitur dapat diubah untuk keamanan dan kualitas produk.'],
      ['Data dan penghentian akun', 'Pengguna tetap memiliki kendali atas data yang dimasukkan dan disarankan mengekspor data sebelum berhenti menggunakan PocketGo.'],
      ['Batas tanggung jawab', 'Sejauh diizinkan hukum, PocketGo tidak bertanggung jawab atas kerugian dari data tidak lengkap, keputusan pengguna, keterlambatan input, atau gangguan pihak ketiga.'],
    ],
  },
  'en-US': {
    back: 'Back to PocketGo',
    effective: 'Effective June 21, 2026',
    title: 'Terms of Service',
    lead: 'These terms govern the use of PocketGo as a personal finance tracking and planning tool.',
    sections: [
      ['Not financial advice', 'Safe to Spend, forecasts, health scores, and insights are estimates based on user-entered data and are not investment, credit, tax, legal, or professional financial advice.'],
      ['User responsibility', 'Users are responsible for account security, accurate records, reviewing calculation assumptions, and verifying commitments with the relevant financial provider.'],
      ['Acceptable use', 'PocketGo may be used for lawful personal finance or small-business needs. Users may not access other accounts, disrupt the service, exploit vulnerabilities, or use it for unlawful activity.'],
      ['Availability', 'We work to keep the service available and calculations accurate, but do not guarantee uninterrupted operation. Features may change for security and product quality.'],
      ['Data and account closure', 'Users retain control over entered data and should export it before they stop using PocketGo.'],
      ['Limitation of liability', 'To the extent permitted by law, PocketGo is not responsible for losses caused by incomplete data, user decisions, delayed input, or third-party service disruption.'],
    ],
  },
}

export function TermsPage() {
  const { language } = useLocalization()
  const content = copy[language]
  return (
    <main className="legal-page">
      <article>
        <Link className="legal-back" to="/"><ArrowLeft size={17} /> {content.back}</Link>
        <span className="legal-icon"><Scale size={25} /></span>
        <p className="eyebrow">{content.effective}</p>
        <h1>{content.title}</h1>
        <p className="legal-lead">{content.lead}</p>
        {content.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}
      </article>
    </main>
  )
}
