const BASE = import.meta.env.BASE_URL;
export function img(path: string): string {
  return BASE + path.replace(/^\//, "");
}
