export function trimAllValues(obj: Record<string, any>): Record<string, any> {
  const trimmedObj: Record<string, any> = {};

  for (const key in obj) {
    if (typeof obj[key] === "string") {
      trimmedObj[key] = obj[key].trim();
    } else {
      trimmedObj[key] = obj[key];
    }
  }

  return trimmedObj;
}
