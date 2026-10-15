/**
 * Copy adhan MP3s into Android res/raw so Local Notifications can play
 * them when the app is closed / in background.
 *
 * Run after: npm run build && npx cap add android (or cap sync)
 */
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const srcDir = path.join(root, 'public', 'audio', 'adhan')
const rawDir = path.join(root, 'android', 'app', 'src', 'main', 'res', 'raw')

if (!fs.existsSync(path.join(root, 'android'))) {
  console.log('No android/ folder yet. Run: npm run build && npx cap add android')
  console.log('Then re-run: node scripts/copy-adhan-native.mjs')
  process.exit(0)
}

fs.mkdirSync(rawDir, { recursive: true })
const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.mp3'))
for (const file of files) {
  const from = path.join(srcDir, file)
  const to = path.join(rawDir, file.toLowerCase())
  fs.copyFileSync(from, to)
  console.log('copied', file, '->', to)
}
console.log(`Done (${files.length} sounds).`)
