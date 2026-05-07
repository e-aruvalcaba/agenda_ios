import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packagePath = path.join(__dirname, '../package.json')
const versionPath = path.join(__dirname, '../public/version.json')

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const version = {
  version: pkg.version,
  timestamp: Date.now()
}

fs.writeFileSync(versionPath, JSON.stringify(version, null, 2))
console.log(`✓ Version updated: ${version.version} at ${new Date(version.timestamp).toISOString()}`)
