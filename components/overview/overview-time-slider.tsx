"use client";

import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

interface OverviewTimeSliderProps {
  totalLength: number;
  historyLength: number;
  dates: string[];
  value: [number, number];
  onChange: (range: [number, number]) => void;
}

const MIN_SPAN = 7;

export function OverviewTimeSlider({
  totalLength,
  historyLength,
  dates,
  value,
  onChange,
}: OverviewTimeSliderProps) {
  const maxIdx = totalLength - 1;
  const trackRef = useRef<HTMLDivElement>(null);

  // Mutable ref of current range so drag handlers never read stale state
  const rangeRef = useRef(value);
  useEffect(() => {
    rangeRef.current = value;
  }, [value]);

  const [dragging, setDragging] = useState<"left" | "right" | "range" | null>(null);
  const dragOrigin = useRef<{ startX: number; startRange: [number, number] } | null>(null);
  // Suppresses the click that fires on the track after a drag release
  const justDragged = useRef(false);

  const labels = useMemo(() => {
    const startDate = dates[value[0]];
    const endDate = dates[value[1]];
    if (!startDate || !endDate) return { start: "", end: "", days: 0 };
    return {
      start: format(parseISO(startDate), "dd MMM yyyy", { locale: it }),
      end: format(parseISO(endDate), "dd MMM yyyy", { locale: it }),
      days: value[1] - value[0] + 1,
    };
  }, [dates, value]);

  const todayPct = maxIdx > 0 ? (historyLength / maxIdx) * 100 : 0;
  const leftPct = maxIdx > 0 ? (value[0] / maxIdx) * 100 : 0;
  const rightPct = maxIdx > 0 ? (value[1] / maxIdx) * 100 : 0;

  const posToIdx = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track) return 0;
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(pct * maxIdx);
    },
    [maxIdx],
  );

  const handlePointerDown = useCallback(
    (target: "left" | "right" | "range", e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragOrigin.current = {
        startX: e.clientX,
        startRange: [rangeRef.current[0], rangeRef.current[1]],
      };
      setDragging(target);
    },
    [],
  );

  useEffect(() => {
    if (!dragging) return;

    function onMove(e: PointerEvent) {
      const origin = dragOrigin.current;
      if (!origin || !trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();

      if (dragging === "range") {
        const deltaX = e.clientX - origin.startX;
        const deltaIdx = Math.round((deltaX / rect.width) * maxIdx);
        const span = origin.startRange[1] - origin.startRange[0];
        let newStart = origin.startRange[0] + deltaIdx;
        let newEnd = newStart + span;
        if (newStart < 0) {
          newStart = 0;
          newEnd = span;
        }
        if (newEnd > maxIdx) {
          newEnd = maxIdx;
          newStart = maxIdx - span;
        }
        onChange([newStart, newEnd]);
      } else if (dragging === "left") {
        const anchor = origin.startRange[1];
        const idx = Math.max(0, Math.min(anchor - MIN_SPAN, posToIdx(e.clientX)));
        onChange([idx, anchor]);
      } else if (dragging === "right") {
        const anchor = origin.startRange[0];
        const idx = Math.min(maxIdx, Math.max(anchor + MIN_SPAN, posToIdx(e.clientX)));
        onChange([anchor, idx]);
      }
    }

    function onUp() {
      dragOrigin.current = null;
      setDragging(null);
      // Block the click event that fires right after pointerup on the track
      justDragged.current = true;
      requestAnimationFrame(() => {
        justDragged.current = false;
      });
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, maxIdx, posToIdx, onChange]);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      // Suppress click that fires after a drag release
      if (justDragged.current) return;
      const idx = posToIdx(e.clientX);
      const span = rangeRef.current[1] - rangeRef.current[0];
      const halfSpan = Math.floor(span / 2);
      let newStart = idx - halfSpan;
      let newEnd = newStart + span;
      if (newStart < 0) {
        newStart = 0;
        newEnd = span;
      }
      if (newEnd > maxIdx) {
        newEnd = maxIdx;
        newStart = maxIdx - span;
      }
      onChange([newStart, newEnd]);
    },
    [maxIdx, posToIdx, onChange],
  );

  return (
    <div className="shadow-card rounded-lg border bg-white px-4 py-4 dark:bg-neutral-950">
      {/* Labels */}
      <div className="text-muted-foreground mb-3 flex items-center justify-between text-xs">
        <span>{labels.start}</span>
        <span className="text-foreground font-medium">{labels.days} giorni</span>
        <span>{labels.end}</span>
      </div>

      {/* Track */}
      <div className="relative py-3">
        {/* "Oggi" marker — positioned relative to the track */}
        {todayPct > 0 && todayPct < 100 && (
          <div
            className="pointer-events-none absolute z-20 flex flex-col items-center"
            style={{
              left: `${todayPct}%`,
              transform: "translateX(-50%)",
              top: 0,
              bottom: 0,
            }}
          >
            <span className="text-primary -mt-0.5 text-[10px] leading-none font-semibold">
              Oggi
            </span>
            <div className="bg-primary mt-0.5 w-px flex-1 opacity-40" />
          </div>
        )}

        <div
          ref={trackRef}
          className="relative h-2 w-full cursor-pointer rounded-full bg-neutral-200 dark:bg-neutral-700"
          onClick={handleTrackClick}
        >
          {/* Active range bar */}
          <div
            className={`absolute top-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm transition-shadow ${
              dragging === "range"
                ? "cursor-grabbing shadow-md shadow-blue-500/30"
                : "cursor-grab hover:shadow-md hover:shadow-blue-500/20"
            }`}
            style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%` }}
            onPointerDown={(e) => handlePointerDown("range", e)}
          />

          {/* Left thumb */}
          <div
            className={`absolute top-1/2 z-10 ${
              dragging === "left" ? "scale-125" : "hover:scale-110"
            }`}
            style={{ left: `${leftPct}%`, transform: "translateX(-50%) translateY(-50%)" }}
            onPointerDown={(e) => handlePointerDown("left", e)}
          >
            <div
              className={`h-4.5 w-4.5 cursor-ew-resize rounded-full border-2 border-blue-500 bg-white shadow-md transition-transform dark:bg-neutral-900 ${
                dragging === "left" ? "ring-2 ring-blue-500/30" : ""
              }`}
            />
          </div>

          {/* Right thumb */}
          <div
            className={`absolute top-1/2 z-10 ${
              dragging === "right" ? "scale-125" : "hover:scale-110"
            }`}
            style={{ left: `${rightPct}%`, transform: "translateX(-50%) translateY(-50%)" }}
            onPointerDown={(e) => handlePointerDown("right", e)}
          >
            <div
              className={`h-4.5 w-4.5 cursor-ew-resize rounded-full border-2 border-indigo-500 bg-white shadow-md transition-transform dark:bg-neutral-900 ${
                dragging === "right" ? "ring-2 ring-indigo-500/30" : ""
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
