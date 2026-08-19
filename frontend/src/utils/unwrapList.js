/**
 * DRF's default pagination wraps list responses as { count, results, ... }.
 * Some endpoints opt out of pagination and return a plain array. This
 * normalizes either shape to a plain array so callers never do `.map()`
 * on the wrong thing.
 */
export function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}
