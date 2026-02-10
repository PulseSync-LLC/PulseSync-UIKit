import { readFileSync, existsSync } from 'fs'
import { spawnSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const envPath = resolve(root, '.env')

function loadEnv() {
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  }
}

loadEnv()

const token = process.env.NPM_TOKEN || process.env.NODE_AUTH_TOKEN
if (!token) {
  console.error('❌ NPM_TOKEN or NODE_AUTH_TOKEN required.')
  console.error('   Create .env with NPM_TOKEN=your_token or run:')
  console.error('   $env:NPM_TOKEN="xxx"; npm run release:local  (PowerShell)')
  console.error('   NPM_TOKEN=xxx npm run release:local          (Bash)')
  process.exit(1)
}

process.env.NODE_AUTH_TOKEN = token

const version = process.argv[2]
if (version) {
  const r = spawnSync('npm', ['pkg', 'set', `version=${version}`], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })
  if (r.status !== 0) process.exit(1)
}

console.log('📦 Building...')
let r = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: true })
if (r.status !== 0) process.exit(1)

console.log('📤 Publishing to npm...')
r = spawnSync('npm', ['publish', '--access', 'public'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_AUTH_TOKEN: token },
})
process.exit(r.status || 0)
