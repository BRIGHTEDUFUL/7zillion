import { useEffect, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { toAspect, toEmbedUrl } from "@/lib/youtube";
import type { Video } from "@/types/content";

/**
 * Full-screen player opened from the video gallery. The iframe only mounts
 * while the dialog is open, so nothing from YouTube loads before a visitor
 * asks for a video.
 *
 * Radix supplies the parts that are easy to get wrong: Escape closes, focus
 * moves into the dialog and returns to the tile that opened it, the page
 * behind stops scrolling, and the dialog is announced with a real title.
 * The arrow keys are ours — they walk the gallery.
 */
export function VideoLightbox({
  videos,
  index,
  triggerRef,
  onClose,
  onIndexChange,
}: {
  videos: Video[];
  /** Active index, or null when the lightbox is closed. */
  index: number | null;
  /** Tile that opened the dialog; focus returns to it when the dialog closes. */
  triggerRef?: { current: HTMLElement | null };
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const open = index !== null && index >= 0 && index < videos.length;
  const video = open && index !== null ? videos[index] : undefined;
  const position = open && index !== null ? index : 0;
  const embedUrl = video ? toEmbedUrl(video.videoUrl) : null;
  const portrait = video ? toAspect(video.videoUrl) === "9:16" : false;
  const multiple = videos.length > 1;
  const panelRef = useRef<HTMLDivElement>(null);

  // The tiles that open this dialog live outside it, so Radix never sees a
  // trigger of its own to hand focus back to — without this a keyboard visitor
  // lands on <body> after closing and has to tab through the page again.
  useEffect(() => {
    if (open) return;

    const trigger = triggerRef?.current;
    if (triggerRef) triggerRef.current = null;
    if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const delta = event.key === "ArrowLeft" ? -1 : 1;
        onIndexChange((position + delta + videos.length) % videos.length);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, position, videos.length, onIndexChange]);

  if (!open || !video || !embedUrl) return null;

  return (
    <Dialog open onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogPortal>
        <DialogOverlay className="video-lightbox-overlay" />
        <DialogPrimitive.Content
          className="video-lightbox"
          aria-describedby={undefined}
          aria-label={video.title}
          ref={panelRef}
          tabIndex={-1}
          onOpenAutoFocus={(event) => {
            // Radix would otherwise tab into the cross-origin player, which
            // keeps Escape and the arrow keys for itself — the dialog becomes
            // impossible to drive from the keyboard. Hold focus on the panel;
            // the visitor tabs on to the player when they want it.
            event.preventDefault();
            panelRef.current?.focus({ preventScroll: true });
          }}
          onClick={(event) => {
            // The panel covers the scrim, so Radix never sees a click
            // "outside" — treat a click that lands on the panel itself as a
            // request to close, and leave anything on the player alone.
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <DialogTitle className="sr-only">{video.title}</DialogTitle>

          <div className={`video-lightbox-frame${portrait ? " is-portrait" : ""}`}>
            <iframe
              src={`${embedUrl}?autoplay=1&rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div className="video-lightbox-bar">
            <div className="video-lightbox-meta">
              <div className="video-lightbox-heading">
                {video.tag && <span className="video-chip">{video.tag}</span>}
                <h2>{video.title}</h2>
              </div>
              {video.caption && <p>{video.caption}</p>}
            </div>
            {multiple && (
              <span className="video-lightbox-count" aria-hidden="true">
                {String(position + 1).padStart(2, "0")} / {String(videos.length).padStart(2, "0")}
              </span>
            )}
          </div>

          {multiple && (
            <div className="video-lightbox-nav">
              <button
                type="button"
                className="video-lightbox-arrow"
                onClick={() => onIndexChange((position - 1 + videos.length) % videos.length)}
                aria-label="Previous video"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="video-lightbox-arrow"
                onClick={() => onIndexChange((position + 1) % videos.length)}
                aria-label="Next video"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          <button
            type="button"
            className="video-lightbox-close"
            onClick={onClose}
            aria-label="Close video"
          >
            <X size={20} />
          </button>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
