import sharp from "sharp"

// Large enough for the fullscreen lightbox on big screens
const FULL_MAX_EDGE = 2560
const FULL_QUALITY = 80
// Covers the gallery grid and challenge cards on retina screens
const THUMBNAIL_MAX_EDGE = 800
const THUMBNAIL_QUALITY = 72

async function toWebp(input: Buffer, maxEdge: number, quality: number): Promise<Buffer> {
  return (
    sharp(input, { failOn: "none" })
      // Applies the camera's EXIF orientation, metadata such as GPS is dropped on output
      .rotate()
      .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer()
  )
}

export async function compressEventPhoto(input: Buffer): Promise<{ full: Buffer; thumbnail: Buffer }> {
  const [full, thumbnail] = await Promise.all([
    toWebp(input, FULL_MAX_EDGE, FULL_QUALITY),
    toWebp(input, THUMBNAIL_MAX_EDGE, THUMBNAIL_QUALITY)
  ])
  return { full, thumbnail }
}
