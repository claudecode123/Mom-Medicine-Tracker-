// Links the GitHub repo to the Netlify site via netlify-cli API (uses keytar auth)
import { spawnSync } from 'child_process'
import { join } from 'path'

const SITE_ID = 'bd5c5548-54bd-4626-8676-ebd4b7433647'
const NETLIFY_SCRIPT = join(import.meta.dirname, 'node_modules', 'netlify-cli', 'bin', 'run.js')

function netlifyApi(endpoint, data) {
  const result = spawnSync(
    process.execPath,
    [NETLIFY_SCRIPT, 'api', endpoint, '--data', JSON.stringify(data)],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  )
  if (result.error) throw result.error
  const out = result.stdout?.trim()
  const err = result.stderr?.trim()
  if (err) console.error('STDERR:', err)
  console.log('STDOUT:', out)
  try { return JSON.parse(out) } catch { return out }
}

console.log('Linking GitHub repo to Netlify site...')

const result = netlifyApi('updateSite', {
  site_id: SITE_ID,
  repo: {
    provider: 'github',
    repo: 'claudecode123/Mom-Medicine-Tracker-',
    repo_branch: 'main',
    cmd: 'npm run build',
    dir: 'dist',
    allowed_branches: ['main']
  }
})

if (result?.repo) {
  console.log('\n✓ GitHub repo linked!')
  console.log('Repo:', result.repo.repo)
  console.log('Branch:', result.repo.repo_branch)
  console.log('\nA deploy should start automatically.')
} else {
  console.log('\nResponse:', JSON.stringify(result, null, 2))
}
