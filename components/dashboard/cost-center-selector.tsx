"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useCostCenterFilter } from "@/lib/stores/cost-center-filter";
import { useCostCenters } from "@/lib/hooks/use-cost-centers";

interface CostCenterItem {
  id: string;
  name: string;
  color: string;
  type: string;
}

export function CostCenterSelector() {
  const [open, setOpen] = useState(false);
  const { selectedIds, toggleId, clearFilter } = useCostCenterFilter();
  const { data: costCenters = [] } = useCostCenters();

  const items = costCenters as CostCenterItem[];
  const selectedCount = selectedIds.length;

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={<Button variant="outline" size="sm" className="h-9 gap-1 text-xs" />}
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
          {selectedCount === 0
            ? "Tutti i centri"
            : `${selectedCount} selezionat${selectedCount === 1 ? "o" : "i"}`}
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="end">
          <Command>
            <CommandInput placeholder="Cerca centro..." />
            <CommandList>
              <CommandEmpty>Nessun risultato.</CommandEmpty>
              <CommandGroup>
                {items.map((cc) => (
                  <CommandItem key={cc.id} value={cc.name} onSelect={() => toggleId(cc.id)}>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedIds.includes(cc.id) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span
                      className="mr-2 inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: cc.color }}
                    />
                    {cc.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCount > 0 && (
        <>
          {items
            .filter((cc) => selectedIds.includes(cc.id))
            .map((cc) => (
              <Badge key={cc.id} variant="secondary" className="gap-1 text-xs">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: cc.color }}
                />
                {cc.name}
              </Badge>
            ))}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={clearFilter}>
            <X className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}
