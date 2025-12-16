import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

export function useSearchParams() {
  const [searchParams, setSearchParams] = useQueryStates(
    {
      search: parseAsString.withDefault(""),
      category: parseAsString.withDefault(""),
      year: parseAsInteger.withDefault(new Date().getFullYear()),
    },
    {
      shallow: false,
    },
  );

  return [searchParams, setSearchParams] as const;
}