import { GPU, ORIGIN, STATUS } from "@/constants/run-data-enum";
// Note: import from 'nuqs/server' to avoid the "use client" directive
import {
  ARRAY_DELIMITER,
  RANGE_DELIMITER,
  SLIDER_DELIMITER,
  SORT_DELIMITER,
} from "@/lib/delimiters";
import {
  createParser,
  createSearchParamsCache,
  createSerializer,
  type inferParserType,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  parseAsTimestamp,
} from "nuqs/server";

// https://logs.run/i?sort=latency.desc

export const parseAsSort = createParser({
  parse(queryValue) {
    const [id, desc] = queryValue.split(SORT_DELIMITER);
    if (!id && !desc) return null;
    return { id, desc: desc === "desc" };
  },
  serialize(value) {
    return `${value.id}.${value.desc ? "desc" : "asc"}`;
  },
});

export const searchParamsParser = {
  // CUSTOM FILTERS
  // success: parseAsArrayOf(parseAsBoolean, ARRAY_DELIMITER),
  // latency: parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  // "timing.dns": parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  // "timing.connection": parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  // "timing.tls": parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  // "timing.ttfb": parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  // "timing.transfer": parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  // status: parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
  // regions: parseAsArrayOf(parseAsStringLiteral(REGIONS), ARRAY_DELIMITER),
  // method: parseAsArrayOf(parseAsStringLiteral(METHODS), ARRAY_DELIMITER),
  // host: parseAsString,
  // pathname: parseAsString,
  created_at: parseAsArrayOf(parseAsTimestamp, RANGE_DELIMITER),
  // REQUIRED FOR SORTING & PAGINATION
  // sort: parseAsSort,
  limit: parseAsInteger.withDefault(60),
  offset: parseAsInteger.withDefault(0),
  // REQUIRED FOR SELECTION
  // uuid: parseAsString,
  id: parseAsString,

  gpu: parseAsArrayOf(parseAsStringLiteral(GPU), ARRAY_DELIMITER),
  status: parseAsArrayOf(parseAsStringLiteral(STATUS), ARRAY_DELIMITER),
  origin: parseAsArrayOf(parseAsStringLiteral(ORIGIN), ARRAY_DELIMITER),
  workflow_id: parseAsString,
  duration: parseAsArrayOf(parseAsInteger, SLIDER_DELIMITER),
};

export const searchParamsCache = createSearchParamsCache(searchParamsParser);

export const searchParamsSerializer = createSerializer(searchParamsParser);

export type SearchParamsType = inferParserType<typeof searchParamsParser>;
