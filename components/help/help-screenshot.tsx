import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HelpHotspot {
  /** X position in percentage (0-100) relative to image width */
  x: number;
  /** Y position in percentage (0-100) relative to image height */
  y: number;
  /** Label shown inside the hotspot (usually a number) */
  label: string | number;
  /** Optional tooltip shown on hover */
  tooltip?: string;
  /** Shape of the hotspot: circle (default) or rect */
  shape?: "circle" | "rect";
  /** Width in percentage for rect shape (0-100). Ignored for circle. */
  w?: number;
  /** Height in percentage for rect shape (0-100). Ignored for circle. */
  h?: number;
}

interface HelpScreenshotProps {
  /** Path relative to /public, e.g. "/help/firm/bilanci/upload-01.png" */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Optional caption shown below the image */
  caption?: string;
  /** Intrinsic image width in pixels (use the source image width, not rendered) */
  width?: number;
  /** Intrinsic image height in pixels (use the source image height, not rendered) */
  height?: number;
  /** Hotspots overlaid on the image */
  hotspots?: HelpHotspot[];
  /** Optional className for outer wrapper */
  className?: string;
  /**
   * If true, renders a visual placeholder instead of loading the image.
   * Useful during development before real screenshots are captured.
   */
  placeholder?: boolean;
  /** Aspect ratio hint for placeholder (width / height). Default 16/10. */
  aspectRatio?: number;
}

export function HelpScreenshot({
  src,
  alt,
  caption,
  width = 1600,
  height = 1000,
  hotspots = [],
  className,
  placeholder = false,
  aspectRatio = 1.6,
}: HelpScreenshotProps) {
  return (
    <figure className={cn("not-prose my-8", className)}>
      <div
        className="relative mx-auto overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        style={{ maxWidth: `${width}px` }}
      >
        {placeholder ? (
          <div
            className="relative flex w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900"
            style={{ aspectRatio }}
          >
            <div className="flex flex-col items-center gap-2 px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-700">
                <ImageIcon className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Screenshot in arrivo
              </p>
              <code className="rounded bg-white/60 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                {src}
              </code>
            </div>
          </div>
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="h-auto w-full"
            sizes={`(min-width: 1024px) min(${width}px, 768px), 100vw`}
          />
        )}
        {hotspots.length > 0 && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {hotspots.map((h, i) => {
              if (h.shape === "rect") {
                const w = h.w ?? 10;
                const hh = h.h ?? 6;
                return (
                  <rect
                    key={i}
                    x={h.x}
                    y={h.y}
                    width={w}
                    height={hh}
                    rx={1}
                    ry={1}
                    className="fill-transparent stroke-indigo-500"
                    strokeWidth={0.4}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              }
              return null;
            })}
          </svg>
        )}
        {hotspots
          .filter((h) => h.shape !== "rect")
          .map((h, i) => (
            <div
              key={i}
              className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
              title={h.tooltip}
            >
              <span className="relative flex h-7 w-7 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500/40" />
                <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-md ring-2 ring-white dark:ring-slate-900">
                  {h.label}
                </span>
              </span>
            </div>
          ))}
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
