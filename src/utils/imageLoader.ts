// ─────────────────────────────────────────────────────────────────────────────
// imageLoader.ts
// Carga una imagen desde una URL (asset de Vite) y la convierte a base64.
// ─────────────────────────────────────────────────────────────────────────────

export async function loadImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
