import { spawnSync } from 'child_process'
import { join } from 'path'

const NETLIFY_SCRIPT = join(import.meta.dirname, 'node_modules', 'netlify-cli', 'bin', 'run.js')
const ACCOUNT_SLUG = 'pavithgrover456'

function netlifyApi(endpoint, data) {
  const args = [NETLIFY_SCRIPT, 'api', endpoint, '--data', JSON.stringify(data)]
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
  if (r.stderr?.includes('Error:')) throw new Error(r.stderr.trim())
  try { return JSON.parse(r.stdout) } catch { return r.stdout }
}

console.log('Disabling team SSO requirement...')
const result = netlifyApi('updateAccount', {
  account_id: ACCOUNT_SLUG,
  site_sso_login: false,
  site_sso_login_context: 'all'
})

if (typeof result === 'object') {
  console.log('site_sso_login:', result.site_sso_login)
  if (!result.site_sso_login) {
    console.log('\n✓ Site is now publicly accessible!')
    console.log('🎉 Visit: https://moms-medicine-tracker.netlify.app')
  } else {
    console.log('\nResponse:', JSON.stringify(result, null, 2))
  }
} else {
  console.log('Response:', result)
}
