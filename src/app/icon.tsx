// Remove the icon.tsx route handler completely and use a static favicon
// This is a simple file that won't be used in the static export

export const dynamic = 'force-static'

// This is a simple placeholder that won't be used
// The actual favicon is in the public directory
export default function Icon() {
  return null
}
