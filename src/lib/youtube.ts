/**
 * YouTube URL helpers shared by the video facade in
 * `src/components/youtube-embed.tsx`.
 *
 * Kept outside the component so the conversions can be unit-tested — these
 * are the values a bad paste in the admin form would otherwise break:
 * watch URLs, short youtu.be URLs and embed URLs must all resolve to an
 * embed URL and a thumbnail that exists.
 */

/** Watch / short / embed URL → canonical `youtube.com/embed/ID`, or null. */
export function toEmbedUrl(url: string): string | null {
  const id = extractVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

/** Watch / short / embed URL → video id, or null when the URL is not YouTube. */
export function extractVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  // https://www.youtube.com/embed/VIDEO_ID
  if (parsed.pathname.startsWith("/embed/")) {
    const id = parsed.pathname.slice("/embed/".length);
    return id || null;
  }

  // https://youtu.be/VIDEO_ID
  if (parsed.hostname === "youtu.be") {
    const id = parsed.pathname.slice(1);
    return id || null;
  }

  // https://www.youtube.com/watch?v=VIDEO_ID (also m.youtube.com, music.youtube.com)
  if (/(^|\.)youtube\.com$/.test(parsed.hostname) && parsed.pathname === "/watch") {
    const id = parsed.searchParams.get("v");
    return id || null;
  }

  return null;
}

/** Thumbnail served by YouTube for a video id (works without an API key). */
export function toThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
