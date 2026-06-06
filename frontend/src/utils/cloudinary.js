/**
 * Apply Cloudinary URL transformations for optimized image delivery.
 * - f_auto  → WebP/AVIF for modern browsers, JPEG fallback
 * - q_auto  → Cloudinary AI picks best quality/size trade-off
 * - w_, h_  → resize to display dimensions (no oversized images on mobile)
 * - c_fill  → crop to exact ratio without distortion
 * - g_auto  → smart crop: Cloudinary AI detects main subject to keep centered
 *
 * Non-Cloudinary URLs (Unsplash, etc.) are returned unchanged.
 */
export function cloudinaryImg(url, { width, height } = {}) {
  if (!url || !url.includes('res.cloudinary.com')) return url;

  const [base, rest] = url.split('/upload/');
  if (!rest) return url;

  const transforms = ['f_auto', 'q_auto', 'g_auto'];
  if (width)  transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push('c_fill');

  return `${base}/upload/${transforms.join(',')}/${rest}`;
}
