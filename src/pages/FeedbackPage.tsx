import { useState } from 'react'
import { ArrowLeft, MessageSquareText } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function FeedbackPage() {
  const location = useLocation()
  const [category, setCategory] = useState('confusing')
  const [rating, setRating] = useState('4')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setSaving(true)
    setStatus('')
    const { error } = await supabase.from('beta_feedback').insert({
      category,
      rating: Number(rating),
      message,
      route: location.state?.from ?? '/more',
    })
    setSaving(false)
    if (error) {
      setStatus(error.message)
      return
    }
    setMessage('')
    setStatus('Terima kasih. Masukanmu sudah tersimpan.')
  }

  return (
    <main className="legal-page feedback-page">
      <article>
        <Link className="legal-back" to="/more"><ArrowLeft size={17} /> Kembali</Link>
        <span className="legal-icon"><MessageSquareText size={25} /></span>
        <p className="eyebrow">Program beta</p>
        <h1>Bantu PocketGo lebih jelas</h1>
        <p className="legal-lead">Ceritakan bagian yang membingungkan, tidak akurat, atau paling membantu. Jangan masukkan nomor rekening, PIN, atau data sensitif.</p>
        <form className="form-stack feedback-form" onSubmit={submit}>
          <label>Jenis masukan<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="confusing">Membingungkan</option><option value="bug">Bug</option><option value="accuracy">Akurasi perhitungan</option><option value="idea">Ide fitur</option><option value="other">Lainnya</option></select></label>
          <label>Pengalaman keseluruhan<select value={rating} onChange={(event) => setRating(event.target.value)}><option value="5">5 — Sangat membantu</option><option value="4">4 — Membantu</option><option value="3">3 — Cukup</option><option value="2">2 — Kurang membantu</option><option value="1">1 — Tidak membantu</option></select></label>
          <label>Masukan<textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={5} maxLength={2000} rows={7} required placeholder="Apa yang terjadi dan apa yang kamu harapkan?" /></label>
          {status ? <p className={status.startsWith('Terima') ? 'inline-message' : 'form-error'} role="status">{status}</p> : null}
          <button className="primary-button" disabled={saving}>{saving ? 'Mengirim...' : 'Kirim masukan'}</button>
        </form>
      </article>
    </main>
  )
}
