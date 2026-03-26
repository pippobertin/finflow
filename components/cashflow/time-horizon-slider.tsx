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
  // Suppresses the click that fires on the track after a drag release
  const justDragged = useRef(false);
  // Mutable ref so handleTrackClick always reads latest viewRange
  const rangeRef = useRef(viewRange);
  useEffect(() => {
    rangeRef.current = viewRange;
  }, [viewRange]);

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

  const handlePointerDown = useCallback((target: DragTarget, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      target,
      startX: e.clientX,
      startRange: [rangeRef.current[0], rangeRef.current[1]],
    };
    setDragging(target);
  }, []);

  useEffect(() => {
    if (!dragging) return;

    function onMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag || !trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const deltaX = e.clientX - drag.startX;
      const deltaIdx = Math.round((deltaX / rect.width) * maxIdx);

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
        const anchor = drag.startRange[1];
        const newStart = Math.max(0, Math.min(anchor - minSpan, posToIdx(e.clientX)));
        setViewRange([newStart, anchor]);
      } else if (drag.target === "right") {
        const anchor = drag.startRange[0];
        const newEnd = Math.min(maxIdx, Math.max(anchor + minSpan, posToIdx(e.clientX)));
        setViewRange([anchor, newEnd]);
      }
    }

    function onUp() {
      dragRef.current = null;
      setDragging(null);
      // Block the click event that fires right after pointerup
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
  }, [dragging, maxIdx, minSpan, posToIdx, setViewRange]);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (justDragged.current) return;
      const idx = posToIdx(e.clientX);
      const current = rangeRef.current;
      const span = current[1] - current[0];
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
    [maxIdx, posToIdx, setViewRange],
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

      {/* Slider area */}
      <div className="relative py-3">
        {/* "Oggi" marker */}
        <div
          className="pointer-events-none absolute z-20 flex flex-col items-center"
          style={{
            left: `${todayPct}%`,
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
