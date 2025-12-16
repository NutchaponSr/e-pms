import { createLoader, parseAsInteger, parseAsString } from "nuqs/server";

export const searchParams = {
  search: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  year: parseAsInteger.withDefault(new Date().getFullYear()),
} 

export const loadSearchParams = createLoader(searchParams);