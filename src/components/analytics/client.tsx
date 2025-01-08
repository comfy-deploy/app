import { useInfiniteQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import * as React from "react";
import { columns } from "./columns";
import { filterFields as defaultFilterFields, filterFields } from "./constants";
import { DataTableInfinite } from "./data-table-infinite";
import { dataOptions } from "./query-options";
import { searchParamsParser } from "./search-params";

export function AnalyticsClient() {
  const [search] = useQueryStates(searchParamsParser);
  const { data, isFetching, isLoading, fetchNextPage } = useInfiniteQuery(
    dataOptions(search),
  );

  const flatData = React.useMemo(
    () => data?.pages?.flatMap((page) => page.data ?? []) ?? [],
    [data?.pages],
  );

  const lastPage = data?.pages?.[data?.pages.length - 1];
  const totalDBRowCount = lastPage?.meta?.totalRowCount;
  const filterDBRowCount = lastPage?.meta?.filterRowCount;
  const chartData = lastPage?.meta?.chartData;
  const totalFetched = flatData?.length;

  const { offset, limit, id, ...filter } = search;

  return (
    <DataTableInfinite
      columns={columns}
      data={flatData}
      totalRows={totalDBRowCount}
      filterRows={filterDBRowCount}
      totalRowsFetched={totalFetched}
      // currentPercentiles={currentPercentiles}
      defaultColumnFilters={Object.entries(filter)
        .map(([key, value]) => ({
          id: key,
          value,
        }))
        .filter(({ value }) => value ?? undefined)}
      // defaultColumnSorting={sort ? [sort] : undefined}
      defaultRowSelection={search.id ? { [search.id]: true } : undefined}
      filterFields={filterFields}
      isFetching={isFetching}
      isLoading={isLoading}
      fetchNextPage={fetchNextPage}
      chartData={chartData}
    />
  );
}
