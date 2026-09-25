import { useState } from "react";
import { Play } from "lucide-react";

import { extractVideoId, toEmbedUrl, toThumbnailUrl } from "@/lib/youtube";

/**
 * Converts a YouTube watch URL or short URL to an embed URL and renders a
 * responsive 16:9 block.  Returns null when videoUrl is absent or blank.
 *
 * Accepts:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://youtube.com/shorts/VIDEO_ID   (share links with ?query are fine)
 *   https://youtu.be/VIDEO_ID
 *   https://www.youtube.com/embed/VIDEO_ID  (already an embed URL)
 *
 * Until the visitor presses play only the video thumbnail loads — the YouTube
 * player itself (≈1 MB of scripts) is fetched on demand, which keeps pages
 * with several videos fast.
 */
export function YouTubeEmbed({
  videoUrl,
  title,
}: {
  videoUrl?: string | undefined;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (!videoUrl || !videoUrl.trim()) return null;

  const embedUrl = toEmbedUrl(videoUrl.trim());
  if (!embedUrl) return null;

  if (playing) {
    const src = embedUrl.includes("?")
      ? `${embedUrl}&autoplay=1&rel=0`
      : `${embedUrl}?autoplay=1&rel=0`;
    return (
      <div className="video-embed">
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  const videoId = extractVideoId(videoUrl.trim());

  return (
    <div className="video-embed">
      <button
        type="button"
        className="video-facade"
        onClick={() => setPlaying(true)}
        aria-label={`Play video: ${title}`}
      >
        {videoId && (
          <img
            src={toThumbnailUrl(videoId)}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}
        <span className="video-play" aria-hidden="true">
          <Play size={26} fill="currentColor" />
        </span>
      </button>
    </div>
  );
}
