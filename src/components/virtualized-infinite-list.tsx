import React, { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface VirtualizedInfiniteListProps<T> {
  queryResult: UseInfiniteQueryResult<InfiniteData<T[], unknown>, unknown>;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderItemClassName?: (item: T) => string;
  renderLoading?: () => React.ReactNode;
  estimateSize?: number;
  header?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}

export function VirtualizedInfiniteList<T>({
  queryResult,
  renderItem,
  renderItemClassName,
  renderLoading = () => <div>Loading...</div>,
  header,
  estimateSize = 50,
  className,
  containerClassName,
  containerStyle,
}: VirtualizedInfiniteListProps<T>) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = queryResult;

  const parentRef = useRef<HTMLDivElement>(null);

  const flatData = React.useMemo(() => data?.pages.flat() ?? [], [data]);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? flatData.length + 1 : flatData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });

  useEffect(() => {
    const lastItem = rowVirtualizer.getVirtualItems().at(-1);
    if (!lastItem) return;

    if (
      lastItem.index >= flatData.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    flatData.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ]);

  return (
    <div
      ref={parentRef}
      className={cn(
        className,
        "scrollbar scrollbar-thumb-gray-200 scrollbar-track-transparent",
      )}
      style={{ height: "400px", overflow: "auto", ...containerStyle }}
    >
      {header && <div className="sticky top-0 z-10">{header}</div>}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
        className={containerClassName}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = flatData[virtualRow.index];
          return (
            <div
              key={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={renderItemClassName ? renderItemClassName(item) : ""}
            >
              {item
                ? renderItem(item, virtualRow.index)
                : hasNextPage
                  ? renderLoading()
                  : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
