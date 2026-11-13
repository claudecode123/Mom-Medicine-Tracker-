import { spawnSync } from 'child_process'
import { join } from 'path'

const NETLIFY_SCRIPT = join(import.meta.dirname, 'node_modules', 'netlify-cli', 'bin', 'run.js')

const result = spawnSync(
  process.execPath,
  ['--stack-trace-limit=30', NETLIFY_SCRIPT, 'deploy', '--prod', '--dir=dist', '--site=bd5c5548-54bd-4626-8676-ebd4b7433647'],
  { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, cwd: import.meta.dirname }
)

console.log('STDOUT:', result.stdout)
console.log('STDERR:', result.stderr)
if (result.error) console.log('ERROR:', result.error)
