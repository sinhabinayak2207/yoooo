// For static export, we need to use a static image instead of ImageResponse

export const dynamic = 'force-static'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// For static export, we'll redirect to a static favicon
export default function Icon() {
  // Return a simple redirect to the static favicon
  return {
    url: '/favicon.ico',
  }
}
