import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = resolve(__dirname, '../public/icon.svg')
const svgBuffer = readFileSync(svgPath)

// 512x512 para manifest (Android, general PWA)
await sharp(svgBuffer)
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(resolve(__dirname, '../public/icon-512.png'))

// 180x180 para apple-touch-icon (iOS home screen)
await sharp(svgBuffer)
  .resize(180, 180)
  .png({ compressionLevel: 9 })
  .toFile(resolve(__dirname, '../public/apple-touch-icon.png'))

// 192x192 para manifest entry adicional (Chrome Android)
await sharp(svgBuffer)
  .resize(192, 192)
  .png({ compressionLevel: 9 })
  .toFile(resolve(__dirname, '../public/icon-192.png'))

console.log('✓ Iconos generados: icon-512.png, icon-192.png, apple-touch-icon.png')
