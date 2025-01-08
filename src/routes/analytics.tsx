import { Client } from "@/components/analytics/client";
import { dataOptions } from "@/components/analytics/query-options";
import { searchParamsCache } from "@/components/analytics/search-params";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useSearch } from "@tanstack/react-router";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsComponent,
});

function AnalyticsComponent() {
  const rawSearch = useSearch({ from: "/analytics" });
  const search = searchParamsCache.parse(rawSearch);
  const queryClient = useQueryClient();
  queryClient.prefetchInfiniteQuery(dataOptions(search));

  return <Client />;
}
