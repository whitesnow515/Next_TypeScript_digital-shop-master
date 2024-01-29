export default function escapeRegExp(string: string) {
  if (!string) return string;
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
