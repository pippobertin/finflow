"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface KeywordInputProps {
  value: string[];
  onChange: (keywords: string[]) => void;
}

export function KeywordInput({ value, onChange }: KeywordInputProps) {
  const [inputValue, setInputValue] = useState("");

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const keyword = inputValue.trim().toLowerCase();
      if (keyword && !value.includes(keyword)) {
        onChange([...value, keyword]);
      }
      setInputValue("");
    }
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeKeyword(keyword: string) {
    onChange(value.filter((k) => k !== keyword));
  }

  return (
    <div className="bg-background flex flex-wrap items-center gap-1.5 rounded-md border px-3 py-2">
      {value.map((keyword) => (
        <Badge key={keyword} variant="secondary" className="gap-1 text-xs">
          {keyword}
          <button
            type="button"
            onClick={() => removeKeyword(keyword)}
            className="hover:bg-muted-foreground/20 ml-0.5 rounded-full"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? "Aggiungi keyword..." : ""}
        className="h-6 min-w-[120px] flex-1 border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
