/**
 * Get the full public URL for an uploaded thumbnail
 */
export function getThumbnailUrl(thumbnailPath: string | null): string | null {
  if (!thumbnailPath) return null;

  // If it's already a full URL (http/https), return as-is
  if (thumbnailPath.startsWith('http://') || thumbnailPath.startsWith('https://')) {
    return thumbnailPath;
  }

  // If it's a relative path starting with /, prepend the base URL
  if (thumbnailPath.startsWith('/')) {
    // In production, you'd want to use your domain
    if (process.env.NODE_ENV === 'production') {
      return `${process.env.NEXTAUTH_URL}${thumbnailPath}`;
    }
    return `http://localhost:3000${thumbnailPath}`;
  }

  return thumbnailPath;
}
