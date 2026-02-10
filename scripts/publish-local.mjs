import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'fs'
import { spawnSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const envPaths = [
  resolve(root, '.env'),
  resolve(process.cwd(), '.env'),
]

function loadEnv() {
  for (const envPath of envPaths) {
    if (!existsSync(envPath)) continue
    const content = readFileSync(envPath, 'utf8').replace(/\r\n/g, '\n')
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([^#=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim().replace(/^\uFEFF/, '')
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        if (key && value) process.env[key] = value
      }
    }
    break
  }
}

loadEnv()

const token = process.env.NPM_TOKEN || process.env.NODE_AUTH_TOKEN
if (!token) {
  const found = envPaths.find(p => existsSync(p))
  console.error('❌ NPM_TOKEN or NODE_AUTH_TOKEN required.')
  if (found) {
    console.error(`   .env found at ${found} but NPM_TOKEN is empty or missing.`)
    console.error('   Add line: NPM_TOKEN=npm_xxxxxxxx')
  } else {
    console.error('   Create .env with: NPM_TOKEN=your_token')
    console.error(`   Or run: $env:NPM_TOKEN="xxx"; npm run release:local  (PowerShell)`)
  }
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
const npmrcPath = resolve(root, '.npmrc')
const hadNpmrc = existsSync(npmrcPath)
const originalNpmrc = hadNpmrc ? readFileSync(npmrcPath, 'utf8') : ''
try {
  writeFileSync(npmrcPath, `//registry.npmjs.org/:_authToken=${token}\n${originalNpmrc}`.trimEnd())
  r = spawnSync('npm', ['publish', '--access', 'public'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })
} finally {
  if (hadNpmrc) {
    writeFileSync(npmrcPath, originalNpmrc)
  } else {
    try { unlinkSync(npmrcPath) } catch (_) {}
  }
}
process.exit(r.status || 0)
