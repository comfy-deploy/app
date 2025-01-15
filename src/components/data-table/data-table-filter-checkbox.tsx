import type { Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useState, useRef, useMemo } from "react";
import type { DataTableCheckboxFilterField } from "./types";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { InputWithAddons } from "@/components/custom/input-with-addons";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type DataTableFilterCheckboxProps<TData> =
  DataTableCheckboxFilterField<TData> & {
    table: Table<TData>;
    singleSelect?: boolean;
  };

export function DataTableFilterCheckbox<TData>({
  table,
  value: _value,
  options,
  component,
  singleSelect = false,
}: DataTableFilterCheckboxProps<TData>) {
  const value = _value as string;
  const [searchValue, setSearchValue] = useState("");
  const column = table.getColumn(value);
  const facetedValue = column?.getFacetedUniqueValues();
  const filterValue = column?.getFilterValue();
  const parentRef = useRef<HTMLDivElement>(null);

  if (!options?.length) return null;

  const Component = component;

  // Memoize the filtered and sorted options to prevent unnecessary re-renders
  const filterOptions = useMemo(
    () =>
      options
        .filter(
          (option) =>
            searchValue === "" ||
            option.label.toLowerCase().includes(searchValue.toLowerCase()),
        )
        .sort((a, b) => a.label.localeCompare(b.label)),
    [options, searchValue],
  );

  const filters = filterValue
    ? Array.isArray(filterValue)
      ? filterValue
      : [filterValue]
    : [];

  const rowVirtualizer = useVirtualizer({
    count: filterOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 41, // Approximate height of each row
    overscan: 5,
  });

  return (
    <div className="grid gap-2">
      {options.length > 4 ? (
        <InputWithAddons
          placeholder="Search"
          leading={<Search className="mt-0.5 h-4 w-4" />}
          containerClassName="h-9 rounded-lg"
          value={searchValue}
          onChange={(e) => {
            e.preventDefault();
            setSearchValue(e.target.value);
          }}
        />
      ) : null}
      <div
        ref={parentRef}
        className="rounded-lg border border-border empty:border-none overflow-auto"
        style={{ height: Math.min(filterOptions.length * 41, 300) }} // Max height of 300px
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const option = filterOptions[virtualRow.index];
            const checked = filters.includes(option.value);

            return (
              <div
                key={String(option.value)}
                className={cn(
                  "group absolute top-0 left-0 w-full",
                  "flex items-center space-x-2 px-2 py-2.5 hover:bg-accent",
                  virtualRow.index !== filterOptions.length - 1
                    ? "border-b"
                    : undefined,
                )}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <Checkbox
                  id={`${value}-${option.value}`}
                  checked={checked}
                  onCheckedChange={(checked) => {
                    let newValue;
                    if (singleSelect) {
                      newValue = checked ? [option.value] : undefined;
                    } else {
                      newValue = checked
                        ? [...(filters || []), option.value]
                        : filters?.filter((value) => option.value !== value);
                    }
                    column?.setFilterValue(
                      newValue?.length ? newValue : undefined,
                    );
                  }}
                />
                <Label
                  htmlFor={`${value}-${option.value}`}
                  className="flex w-full items-center justify-between gap-1 min-w-0 text-muted-foreground group-hover:text-accent-foreground"
                >
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    {Component ? (
                      <Component {...option} />
                    ) : (
                      <span className="truncate font-normal">
                        {option.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-xs">
                      {facetedValue?.get(option.value)}
                    </span>
                    {!singleSelect && (
                      <button
                        type="button"
                        onClick={() => column?.setFilterValue([option.value])}
                        className={cn(
                          "hidden font-normal text-muted-foreground backdrop-blur-sm hover:text-foreground group-hover:block",
                          "rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        )}
                      >
                        <span className="px-2">only</span>
                      </button>
                    )}
                  </div>
                </Label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
