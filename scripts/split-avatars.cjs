const sharp = require('sharp')
const fs = require('node:fs/promises')
const path = require('node:path')

const source = path.join(__dirname, '../public/images/Image ChatGPT 2 oct. 2026, 23_56_01.png')
const destination = path.join(__dirname, '../public/images/avatars')

// Each bounding box follows a character, including those crossing grid lines.
const avatars = [
  ['corgi', 28, 30, 329, 490],
  ['dalmatian', 370, 58, 343, 462],
  ['shiba', 738, 40, 322, 480],
  ['bulldog', 1093, 28, 321, 492],
  ['husky', 24, 522, 329, 523],
  ['poodle', 358, 532, 376, 513],
  ['dachshund', 738, 565, 342, 480],
  ['golden', 1083, 547, 348, 498],
]

async function main() {
  await fs.mkdir(destination, { recursive: true })
  for (const [id, left, top, width, height] of avatars) {
    await sharp(source)
      .extract({ left, top, width, height })
      .resize(128, 128, { fit: 'contain', background: '#F8F5F0' })
      .webp({ quality: 90 })
      .toFile(path.join(destination, `${id}.webp`))
  }
  console.log('Created 8 avatars at 128 × 128 px.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
