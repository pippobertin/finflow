"use client";

import { useMemo, useRef, useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { useCashflowSettings } from "@/lib/stores/cashflow-settings";

interface TimeHorizonSliderProps {
  timelineLength: number;
  historyLength: number;
  dates: string[];
}

type DragTarget = "left" | "right" | "range" | null;

export function TimeHorizonSlider({
  timelineLength,
  historyLength,
  dates,
}: TimeHorizonSliderProps) {
  const { viewRange, setViewRange } = useCashflowSettings();
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    target: DragTarget;
    startX: number;
    startRange: [number, number];
  } | null>(null);
  const [dragging, setDragging] = useState<DragTarget>(null);

  const maxIdx = timelineLength - 1;
  const minSpan = 7;

  const labels = useMemo(() => {
    const startDate = dates[viewRange[0]];
    const endDate = dates[viewRange[1]];
    if (!startDate || !endDate) return { start: "", end: "" };
    return {
      start: format(parseISO(startDate), "dd MMM yyyy", { locale: it }),
      end: format(parseISO(endDate), "dd MMM yyyy", { locale: it }),
    };
  }, [dates, viewRange]);

  const todayPct = maxIdx > 0 ? (historyLength / maxIdx) * 100 : 0;
  const leftPct = maxIdx > 0 ? (viewRange[0] / maxIdx) * 100 : 0;
  const rightPct = maxIdx > 0 ? (viewRange[1] / maxIdx) * 100 : 0;

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
    (target: DragTarget, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragRef.current = {
        target,
        startX: e.clientX,
        startRange: [viewRange[0], viewRange[1]],
      };
      setDragging(target);
    },
    [viewRange],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || !trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const deltaX = e.clientX - drag.startX;
      const deltaPct = deltaX / rect.width;
      const deltaIdx = Math.round(deltaPct * maxIdx);

      if (drag.target === "range") {
        const span = drag.startRange[1] - drag.startRange[0];
        let newStart = drag.startRange[0] + deltaIdx;
        let newEnd = newStart + span;
        if (newStart < 0) {
          newStart = 0;
          newEnd = span;
        }
        if (newEnd > maxIdx) {
          newEnd = maxIdx;
          newStart = maxIdx - span;
        }
        setViewRange([newStart, newEnd]);
      } else if (drag.target === "left") {
        const newStart = Math.max(0, Math.min(viewRange[1] - minSpan, posToIdx(e.clientX)));
        setViewRange([newStart, viewRange[1]]);
      } else if (drag.target === "right") {
        const newEnd = Math.min(maxIdx, Math.max(viewRange[0] + minSpan, posToIdx(e.clientX)));
        setViewRange([viewRange[0], newEnd]);
      }
    },
    [maxIdx, minSpan, posToIdx, setViewRange, viewRange],
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [dragging, handlePointerMove, handlePointerUp]);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragRef.current) return;
      const idx = posToIdx(e.clientX);
      const span = viewRange[1] - viewRange[0];
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
      setViewRange([newStart, newEnd]);
    },
    [maxIdx, posToIdx, setViewRange, viewRange],
  );

  return (
    <div className="rounded-lg border bg-white px-4 py-4 dark:bg-neutral-950">
      {/* Labels row */}
      <div className="text-muted-foreground mb-3 flex items-center justify-between text-xs">
        <span>{labels.start}</span>
        <span className="text-foreground font-medium">
          {viewRange[1] - viewRange[0] + 1} giorni
        </span>
        <span>{labels.end}</span>
      </div>

      {/* Slider area with vertical space for thumbs */}
      <div className="relative px-2.5 py-3">
        {/* "Oggi" marker — contained within track height */}
        <div
          className="pointer-events-none absolute z-20 flex flex-col items-center"
          style={{
            left: `calc(${todayPct}% + 10px)`,
            transform: "translateX(-50%)",
            top: 0,
            bottom: 0,
          }}
        >
          <span className="text-primary -mt-0.5 text-[10px] leading-none font-semibold">Oggi</span>
          <div className="bg-primary mt-0.5 w-px flex-1 opacity-40" />
        </div>

        {/* Track background — clickable */}
        <div
          ref={trackRef}
          className="relative h-2 w-full cursor-pointer rounded-full bg-neutral-200 dark:bg-neutral-700"
          onClick={handleTrackClick}
        >
          {/* Active range bar — draggable to translate */}
          <div
            className={`absolute top-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm transition-shadow ${
              dragging === "range"
                ? "cursor-grabbing shadow-md shadow-blue-500/30"
                : "cursor-grab hover:shadow-md hover:shadow-blue-500/20"
            }`}
            style={{
              left: `${leftPct}%`,
              width: `${rightPct - leftPct}%`,
            }}
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
