import { useQueryStates } from "nuqs";

export function useSearchParams<T extends Record<string, any>>(parsers: T) {
  const [values, setValues] = useQueryStates(parsers, {
    shallow: false,
  })

  return [values, setValues] as const
}