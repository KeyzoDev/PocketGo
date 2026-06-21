import { chromium } from 'playwright'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:5173'
const outputDir = path.resolve('tmp/visual-qa')
await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  locale: 'id-ID',
  timezoneId: 'Asia/Jakarta',
  colorScheme: 'light',
})
const page = await context.newPage()
const consoleErrors = []
const pageErrors = []
const networkErrors = []

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('pageerror', (error) => pageErrors.push(error.message))
page.on('response', (response) => {
  if (response.status() >= 400) networkErrors.push(`${response.status()} ${response.url()}`)
})

function screenshot(name, fullPage = true) {
  return page.screenshot({
    path: path.join(outputDir, `${name}.png`),
    fullPage,
  })
}

async function clickButton(name) {
  await page.getByRole('button', { name, exact: true }).click()
}

const manifestResponse = await page.request.get(`${baseURL}/manifest.webmanifest`)
if (!manifestResponse.ok()) throw new Error(`Manifest PWA gagal dimuat: ${manifestResponse.status()}`)
const manifest = await manifestResponse.json()
if (manifest.display !== 'standalone' || !manifest.icons?.length) {
  throw new Error(`Manifest PWA tidak siap dipasang: ${JSON.stringify(manifest)}`)
}
const serviceWorkerResponse = await page.request.get(`${baseURL}/sw.js`)
if (!serviceWorkerResponse.ok()) throw new Error(`Service worker gagal dimuat: ${serviceWorkerResponse.status()}`)

await page.goto(baseURL, { waitUntil: 'networkidle' })
await page.goto(`${baseURL}/privacy`, { waitUntil: 'networkidle' })
await page.getByRole('heading', { name: 'Kebijakan Privasi' }).waitFor()
await page.goto(`${baseURL}/terms`, { waitUntil: 'networkidle' })
await page.getByRole('heading', { name: 'Ketentuan Penggunaan' }).waitFor()
await page.goto(baseURL, { waitUntil: 'networkidle' })
if (await page.getByRole('heading', { name: 'Masuk ke PocketGo' }).isVisible().catch(() => false)) {
  await page.locator('.auth-language select').selectOption('en-US')
  await page.getByRole('heading', { name: 'Sign in to PocketGo' }).waitFor()
  await page.locator('.auth-language select').selectOption('id-ID')
  await page.getByRole('heading', { name: 'Masuk ke PocketGo' }).waitFor()
  await screenshot('00-auth-compact-language', false)
  if (!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) {
    throw new Error('TEST_EMAIL dan TEST_PASSWORD diperlukan untuk QA pada mode Supabase.')
  }
  await page.getByLabel('Email').fill(process.env.TEST_EMAIL)
  await page.getByLabel('Kata sandi').fill(process.env.TEST_PASSWORD)
  await page.locator('.auth-card form .primary-button').click()
  await page.waitForTimeout(8000)
  if (!await page.getByRole('heading', { name: 'Pilih bahasa dan wilayah' }).isVisible().catch(() => false)) {
    await screenshot('00-auth-failure')
    throw new Error(`Setelah login, onboarding tidak tampil: ${JSON.stringify({
      body: (await page.locator('body').innerText()).slice(0, 2000),
      consoleErrors,
      pageErrors,
      networkErrors,
    }, null, 2)}`)
  }
}
await page.getByRole('heading', { name: 'Pilih bahasa dan wilayah' }).waitFor()
await clickButton('Lanjut')
await page.getByRole('heading', { name: 'Uang lebih jelas, keputusan lebih tenang.' }).waitFor()
await screenshot('01-onboarding')

await page.getByPlaceholder('Bagaimana kami menyapamu?').fill('Andi')
await clickButton('Mulai')
await page.getByRole('button', { name: 'Bertahan sampai pemasukan berikutnya' }).click()
await page.locator('select').selectOption('monthly')
await clickButton('Lanjut')
await page.getByPlaceholder('Contoh: Rekening utama').fill('Rekening Utama')
await page.locator('select').selectOption('bank')
await page.getByPlaceholder('0').fill('2450000')
await clickButton('Selesai')
await page.getByRole('heading', { name: 'Hai, Andi' }).waitFor()

await page.getByRole('link', { name: 'Lainnya' }).click()
await page.getByRole('heading', { name: 'Lainnya' }).waitFor()
await page.locator('.settings-section').first().getByRole('button', { name: 'Tambah', exact: true }).click()
await page.getByLabel('Nama dompet').fill('E-wallet')
await page.locator('.modal-sheet select').nth(0).selectOption('ewallet')
await page.getByLabel('Saldo awal').fill('500000')
await clickButton('Simpan dompet')

await page.getByRole('link', { name: 'Transaksi' }).click()
await page.getByRole('heading', { name: 'Transaksi', exact: true }).waitFor()
await page.getByRole('button', { name: 'Tambah', exact: true }).click()
await screenshot('06-transaction-chooser', false)
await page.getByRole('button', { name: /Pengeluaran.*Untuk uang yang keluar/ }).click()
await page.locator('.amount-field input').fill('100000')
if (await page.locator('.amount-field input').inputValue() !== '100.000') {
  throw new Error(`Format nominal IDR tidak benar: ${await page.locator('.amount-field input').inputValue()}`)
}
await page.locator('.modal-sheet select').nth(0).selectOption({ label: 'Rekening Utama' })
if (await page.getByRole('button', { name: 'Makan & Minum', exact: true }).count() !== 1) {
  throw new Error('Kategori default Makan & Minum tampil lebih dari sekali.')
}
await page.getByRole('button', { name: 'Makan & Minum' }).click()
await page.getByLabel(/Merchant/).fill('Warung Makan')
await clickButton('Simpan transaksi')

await page.getByRole('button', { name: 'Tambah', exact: true }).click()
await page.getByRole('button', { name: /Pemasukan.*Untuk uang yang masuk/ }).click()
await page.locator('.amount-field input').fill('1000000')
await page.locator('.modal-sheet select').nth(0).selectOption({ label: 'Rekening Utama' })
await page.getByRole('button', { name: 'Gaji' }).click()
await page.getByLabel(/Merchant/).fill('Perusahaan')
await clickButton('Simpan transaksi')

await page.getByRole('button', { name: 'Tambah', exact: true }).click()
await page.getByRole('button', { name: /Transfer.*Pindah uang antar wallet/ }).click()
await page.locator('.amount-field input').fill('200000')
await page.locator('.modal-sheet select').nth(0).selectOption({ label: 'Rekening Utama' })
await page.locator('.modal-sheet select').nth(1).selectOption({ label: 'E-wallet' })
await clickButton('Simpan transaksi')

await page.getByRole('link', { name: 'Rencana' }).click()
await page.getByRole('heading', { name: 'Rencana' }).waitFor()
await page.locator('.plan-section').first().locator('.section-title-row').getByRole('button', { name: 'Buat', exact: true }).click()
await page.getByLabel('Nama budget').fill('QA Budget')
await page.getByLabel('Batas pengeluaran').fill('2000000')
await clickButton('Simpan budget')
await page.getByRole('button', { name: 'Edit QA Budget' }).click()
await page.getByLabel('Nama budget').fill('QA Budget Updated')
await page.getByLabel('Batas pengeluaran').fill('2500000')
await clickButton('Simpan budget')
await page.getByText('QA Budget Updated', { exact: true }).waitFor()
page.once('dialog', (dialog) => dialog.accept())
await page.getByRole('button', { name: 'Hapus QA Budget Updated' }).click()
await page.getByRole('heading', { name: 'Belum ada budget' }).waitFor()
await page.locator('.plan-section').nth(1).locator('.section-title-row').getByRole('button', { name: 'Tambah', exact: true }).click()
await page.getByLabel('Nama').fill('Tagihan listrik')
await page.locator('.modal-sheet select').nth(0).selectOption('expense')
await page.getByLabel('Jumlah').fill('275000')
await page.locator('.modal-sheet select').nth(1).selectOption({ label: 'Rekening Utama' })
await page.locator('.modal-sheet select').nth(2).selectOption('monthly')
await clickButton('Simpan jadwal')

await page.locator('.plan-section').nth(2).locator('.section-title-row').getByRole('button', { name: 'Tambah', exact: true }).click()
await page.getByLabel('Nama tujuan').fill('Dana darurat')
await page.getByLabel('Target dana').fill('10000000')
await page.getByLabel('Dana saat ini').fill('1500000')
await page.getByLabel('Rencana tabungan per bulan').fill('500000')
await clickButton('Simpan tujuan')

await page.locator('.plan-section').nth(3).locator('.section-title-row').getByRole('button', { name: 'Tambah', exact: true }).click()
await page.getByLabel('Nama').fill('Paylater belanja')
await page.getByLabel('Pemberi pinjaman').fill('Penyedia Paylater')
await page.locator('.modal-sheet select').nth(0).selectOption('paylater')
await page.getByLabel('Jumlah awal').fill('1200000')
await page.getByLabel('Sisa utang').fill('900000')
await page.getByLabel('Cicilan per bulan').fill('300000')
await page.getByLabel('Tanggal jatuh tempo').fill('25')
await clickButton('Simpan utang')
await screenshot('02-plan')
await page.evaluate(() => scrollTo(0, 0))
await screenshot('02-plan-viewport', false)

await page.getByRole('link', { name: 'Home' }).click()
await page.getByRole('heading', { name: 'Hai, Andi' }).waitFor()
if (await page.getByRole('heading', { name: 'Tambah transaksi' }).count()) {
  throw new Error('Section Tambah transaksi lama masih tampil di Home.')
}
const totalText = await page.locator('.money-summary').first().innerText()
if (!totalText.includes('3.850.000')) {
  throw new Error(`Saldo total tidak sesuai setelah transfer: ${totalText}`)
}
await screenshot('03-home-full')
await page.evaluate(() => scrollTo(0, 0))
await screenshot('04-home-viewport', false)

await page.getByRole('link', { name: 'Transaksi' }).click()
await page.getByRole('heading', { name: 'Transaksi', exact: true }).waitFor()
await screenshot('05-transactions')
const storedState = await page.evaluate(() => JSON.parse(localStorage.getItem('pocketgo-state-v1') ?? '{}'))
const storedTransfers = storedState.transactions?.filter((transaction) => transaction.transferGroupId) ?? []
const transferRows = await page.getByText('Transfer internal', { exact: true }).count()
if ((storedState.transactions && storedTransfers.length !== 2) || transferRows !== 1) {
  throw new Error(`Transfer tidak konsisten: ${JSON.stringify({
    transferRows,
    storedTransfers,
    transactionPage: (await page.locator('body').innerText()).slice(0, 2000),
  }, null, 2)}`)
}

await page.getByRole('button', { name: 'Tambah', exact: true }).click()
await page.getByRole('button', { name: /Pengeluaran.*Untuk uang yang keluar/ }).click()
const sheetMetrics = await page.locator('.modal-content').evaluate((element) => ({
  clientHeight: element.clientHeight,
  scrollHeight: element.scrollHeight,
  overflowY: getComputedStyle(element).overflowY,
}))
if (sheetMetrics.scrollHeight > sheetMetrics.clientHeight && sheetMetrics.overflowY !== 'auto') {
  throw new Error(`Sheet tidak scrollable: ${JSON.stringify(sheetMetrics)}`)
}
await screenshot('07-transaction-sheet', false)
await page.getByRole('button', { name: 'Tutup' }).click()

await page.getByRole('link', { name: 'Insight' }).click()
await page.getByRole('heading', { name: 'Insight' }).waitFor()
await page.waitForTimeout(500)
await screenshot('07-insight')
await page.evaluate(() => scrollTo(0, 0))
await screenshot('07-insight-viewport', false)

await page.getByRole('link', { name: 'Lainnya' }).click()
await page.getByRole('heading', { name: 'Lainnya' }).waitFor()
await screenshot('08-more')
await page.getByRole('button', { name: /Bahasa & Wilayah/ }).click()
await page.locator('.modal-sheet select[name="language"]').selectOption('en-US')
await page.locator('.modal-sheet select[name="countryCode"]').selectOption('US')
await page.locator('.modal-sheet select[name="currency"]').selectOption('USD')
await clickButton('Simpan')
await page.getByRole('heading', { name: 'More' }).waitFor()
await page.getByRole('link', { name: 'Home' }).click()
await page.getByText(/\$3,850,000\.00/).waitFor()
await page.getByRole('link', { name: 'More' }).click()
await page.getByRole('button', { name: /Language & Region/ }).click()
await page.locator('.modal-sheet select[name="language"]').selectOption('id-ID')
await page.locator('.modal-sheet select[name="countryCode"]').selectOption('ID')
await page.locator('.modal-sheet select[name="currency"]').selectOption('IDR')
await clickButton('Save')
await page.getByRole('heading', { name: 'Lainnya' }).waitFor()
await page.getByRole('link', { name: 'Kirim feedback beta' }).click()
await page.getByRole('heading', { name: 'Bantu PocketGo lebih jelas' }).waitFor()
await page.getByLabel('Jenis masukan').selectOption('accuracy')
await page.getByLabel('Pengalaman keseluruhan').selectOption('4')
await page.getByLabel('Masukan', { exact: true }).fill('Perhitungan mudah dipahami dan perlu terus dijaga akurasinya.')
await page.getByRole('button', { name: 'Kirim masukan' }).click()
await page.getByText('Terima kasih. Masukanmu sudah tersimpan.').waitFor()
await page.evaluate(() => scrollTo(0, 0))
await screenshot('09-feedback-viewport', false)

const layoutChecks = await page.evaluate(() => {
  const overflowing = [...document.querySelectorAll('body *')]
    .filter((element) => {
      const rect = element.getBoundingClientRect()
      return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1
    })
    .slice(0, 10)
    .map((element) => ({
      tag: element.tagName,
      className: element.className,
      text: element.textContent?.trim().slice(0, 60),
    }))
  return {
    viewport: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    overflowing,
  }
})

const sourceImage = (await readFile(path.resolve('design/reference-option-2.png'))).toString('base64')
const implementationImage = (await readFile(path.join(outputDir, '04-home-viewport.png'))).toString('base64')
const comparisonPage = await context.newPage()
await comparisonPage.setViewportSize({ width: 800, height: 884 })
await comparisonPage.setContent(`
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 40px 0 0; background: white; font-family: sans-serif; }
    .labels { position: fixed; inset: 0 0 auto; display: grid; grid-template-columns: 390px 390px; gap: 20px; height: 40px; align-items: center; color: #0b2447; font-size: 13px; font-weight: 700; }
    .labels span { padding-left: 12px; }
    .compare { display: grid; grid-template-columns: 390px 390px; gap: 20px; }
    img { width: 390px; height: 844px; object-fit: fill; display: block; }
  </style>
  <div class="labels"><span>Reference option 2</span><span>PocketGo implementation</span></div>
  <div class="compare">
    <img src="data:image/png;base64,${sourceImage}" alt="Reference">
    <img src="data:image/png;base64,${implementationImage}" alt="Implementation">
  </div>
`)
await comparisonPage.screenshot({ path: path.join(outputDir, 'home-comparison.png') })

await browser.close()

if (consoleErrors.length || pageErrors.length) {
  throw new Error(JSON.stringify({ consoleErrors, pageErrors }, null, 2))
}
if (layoutChecks.bodyScrollWidth > layoutChecks.viewport || layoutChecks.overflowing.length) {
  throw new Error(`Horizontal overflow: ${JSON.stringify(layoutChecks, null, 2)}`)
}

console.log(JSON.stringify({
  status: 'passed',
  outputDir,
  transferRows,
  sheetMetrics,
  layoutChecks,
  consoleErrors,
  pageErrors,
  networkErrors,
  pwa: { display: manifest.display, iconCount: manifest.icons.length, serviceWorker: serviceWorkerResponse.status() },
}, null, 2))
