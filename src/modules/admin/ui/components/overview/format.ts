export function buddhistYear(year: number) {
  return year + 543;
}

export function yearOptions(currentYear: number) {
  return [
    currentYear + 1,
    ...Array.from({ length: 5 }, (_, index) => currentYear - index),
  ];
}
