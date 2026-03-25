"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, itemLabel, onPageChange }: PaginationProps) {
  const [pageInput, setPageInput] = useState(String(page));

  // Sync input when page prop changes (e.g. filter/tab change resets to 1)
  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const syncInput = useCallback(
    (newPage: number) => {
      setPageInput(String(newPage));
      onPageChange(newPage);
    },
    [onPageChange],
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPageInput(e.target.value);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      goToPage();
    }
  }

  function handleInputBlur() {
    goToPage();
  }

  function goToPage() {
    const n = parseInt(pageInput, 10);
    if (isNaN(n) || n < 1) {
      syncInput(1);
    } else if (n > totalPages) {
      syncInput(totalPages);
    } else {
      syncInput(n);
    }
  }

  return (
    <div className="mt-4 flex items-center justify-between border-t pt-4">
      <p className="text-muted-foreground text-sm">
        {total} {itemLabel} — pagina {page} di {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncInput(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Precedente
        </Button>

        <div className="flex items-center gap-1 text-sm">
          <Input
            value={pageInput}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            className="h-8 w-14 text-center text-xs"
            aria-label="Vai a pagina"
          />
          <span className="text-muted-foreground">/ {totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => syncInput(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Successiva
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
