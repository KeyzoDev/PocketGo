import { Sparkles } from 'lucide-react'
import { Modal } from './Modal'
import { PremiumIcon } from './PremiumIcon'
import { useLocalization } from '../i18n'

type ProFeature = 'import' | 'scan' | 'export'

export function ProComingSoonModal({
  open,
  feature = 'import',
  onClose,
}: {
  open: boolean
  feature?: ProFeature
  onClose: () => void
}) {
  const { language } = useLocalization()
  const isIndonesian = language === 'id-ID'
  const isScan = feature === 'scan'
  const isExport = feature === 'export'
  const title = isIndonesian ? 'Fitur Pro segera hadir' : 'Pro feature coming soon'
  const featureName = isIndonesian
    ? isScan ? 'Scan struk otomatis' : isExport ? 'Export Excel' : 'Import mutasi otomatis'
    : isScan ? 'Automatic receipt scan' : isExport ? 'Excel export' : 'Automatic statement import'
  const body = isIndonesian
    ? isExport
      ? 'Kami sedang menyiapkan export Excel yang rapi, aman, dan siap dipakai untuk arsip atau laporan pribadi.'
      : 'Kami sedang menyiapkan fitur ini agar hasil bacanya lebih akurat, aman, dan tetap mudah dikoreksi sebelum masuk ke transaksi.'
    : isExport
      ? 'We are preparing a clean and secure Excel export for personal backups and reports.'
      : 'We are preparing this feature so extraction is more accurate, secure, and easy to review before it becomes a transaction.'
  const hint = isIndonesian
    ? isExport
      ? 'Untuk sementara, data tetap tersimpan di PocketGo dan bisa kamu kelola dari aplikasi.'
      : 'Untuk sementara, catat transaksi manual dulu agar saldo dan laporan tetap rapi.'
    : isExport
      ? 'For now, your data remains available inside PocketGo.'
      : 'For now, use manual entry so balances and reports stay clean.'
  const close = isIndonesian ? 'Tutup' : 'Close'
  const label = isIndonesian ? 'PocketGo Pro' : 'PocketGo Pro'

  return (
    <Modal open={open} title={title} onClose={onClose} closeLabel={close}>
      <section className="pro-coming-soon" aria-label={title}>
        <div className="pro-coming-soon-orb">
          <PremiumIcon name={isScan ? 'scan' : isExport ? 'excel' : 'import'} variant="emptyState" tone={isScan ? 'purple' : isExport ? 'green' : 'blue'} size="xl" />
          <span><Sparkles size={16} /></span>
        </div>
        <div>
          <small>{label}</small>
          <h3>{featureName}</h3>
          <p>{body}</p>
        </div>
        <div className="pro-coming-soon-note">
          {hint}
        </div>
        <button className="primary-button" type="button" onClick={onClose}>{close}</button>
      </section>
    </Modal>
  )
}
