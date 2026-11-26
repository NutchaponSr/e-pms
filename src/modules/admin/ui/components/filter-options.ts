export function selectOptions(allLabel: string, values: string[]) {
  return [
    { value: "all", label: allLabel },
    ...values.map((value) => ({ value, label: value })),
  ];
}
