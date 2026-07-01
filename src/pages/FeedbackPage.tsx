import { useState } from 'react'
import { ArrowLeft, MessageSquareText } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLocalization } from '../i18n'

export function FeedbackPage() {
  const location = useLocation()
  const { t, language } = useLocalization()
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
    setStatus(t('feedback.success'))
  }

  return (
    <main className="legal-page feedback-page">
      <article>
        <Link className="legal-back" to="/more"><ArrowLeft size={17} /> {t('feedback.back')}</Link>
        <span className="legal-icon"><MessageSquareText size={25} /></span>
        <p className="eyebrow">{t('feedback.eyebrow')}</p>
        <h1>{t('feedback.title')}</h1>
        <p className="legal-lead">{t('feedback.lead')}</p>
        <form className="form-stack feedback-form" noValidate onSubmit={submit}>
          <label>{t('feedback.type')}<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="confusing">{language === 'id-ID' ? 'Membingungkan' : 'Confusing'}</option><option value="bug">Bug</option><option value="accuracy">{language === 'id-ID' ? 'Akurasi perhitungan' : 'Calculation accuracy'}</option><option value="idea">{language === 'id-ID' ? 'Ide fitur' : 'Feature idea'}</option><option value="other">{language === 'id-ID' ? 'Lainnya' : 'Other'}</option></select></label>
          <label>{t('feedback.rating')}<select value={rating} onChange={(event) => setRating(event.target.value)}><option value="5">5 — {language === 'id-ID' ? 'Sangat membantu' : 'Very helpful'}</option><option value="4">4 — {language === 'id-ID' ? 'Membantu' : 'Helpful'}</option><option value="3">3 — {language === 'id-ID' ? 'Cukup' : 'Okay'}</option><option value="2">2 — {language === 'id-ID' ? 'Kurang membantu' : 'Not very helpful'}</option><option value="1">1 — {language === 'id-ID' ? 'Tidak membantu' : 'Not helpful'}</option></select></label>
          <label>{t('feedback.message')}<textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={5} maxLength={2000} rows={7} placeholder={t('feedback.placeholder')} /></label>
          {status ? <p className={status === t('feedback.success') ? 'inline-message' : 'form-error'} role="status">{status}</p> : null}
          <button className="primary-button" disabled={saving}>{saving ? t('feedback.sending') : t('feedback.send')}</button>
        </form>
      </article>
    </main>
  )
}
