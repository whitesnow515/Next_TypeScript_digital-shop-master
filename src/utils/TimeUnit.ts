export type TimeUnits =
  | "ms"
  | "millisecond"
  | "second"
  | "s"
  | "minute"
  | "m"
  | "min"
  | "hour"
  | "h"
  | "day"
  | "d"
  | "week"
  | "w"
  | "month"
  | "M"
  | "year"
  | "y";

export function getMsFromUnit(unit: TimeUnits, value: number): number {
  switch (unit) {
    case "ms":
    case "millisecond":
      return value;
    case "second":
    case "s":
      return value * 1000;
    case "minute":
    case "m":
    case "min":
      return value * 60 * 1000;
    case "hour":
    case "h":
      return value * 60 * 60 * 1000;
    case "day":
    case "d":
      return value * 24 * 60 * 60 * 1000;
    case "week":
    case "w":
      return value * 7 * 24 * 60 * 60 * 1000;
    case "month":
    case "M":
      return value * 30 * 24 * 60 * 60 * 1000;
    case "year":
    case "y":
      return value * 365 * 24 * 60 * 60 * 1000;
    default:
      return value;
  }
}

export function getSecondsFromUnit(unit: TimeUnits, value: number): number {
  return getMsFromUnit(unit, value) / 1000;
}
