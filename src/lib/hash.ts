/** Deep links look like #bucket=<id>. Today is the empty hash. */
export function readBucketFromHash(hash: string): string | null {
  const match = hash.match(/^#bucket=([^&]+)$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export function bucketHash(bucketId: string | null): string {
  return bucketId ? `#bucket=${encodeURIComponent(bucketId)}` : "";
}
