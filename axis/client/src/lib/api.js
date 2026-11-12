// All server calls go through here. Errors come back as Error objects with a friendly message.
const cache = new Map();

async function request(method, url, body, headers = {}) {
  let res;
  try {
    res = await fetch(`/api${url}`, {
      method,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error('Network error. Please check your connection.'), { status: 0 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  return data;
}

export const api = {
  get: (url, headers) => request('GET', url, null, headers),
  post: (url, body, headers) => request('POST', url, body, headers),
  patch: (url, body, headers) => request('PATCH', url, body, headers),
  delete: (url, headers) => request('DELETE', url, null, headers),
  // For data that rarely changes (catalog, articles). Cached for one minute.
  cached(url, ttl = 60_000) {
    const hit = cache.get(url);
    if (hit && Date.now() - hit.at < ttl) return hit.promise;
    const promise = request('GET', url).catch(err => { cache.delete(url); throw err; });
    cache.set(url, { at: Date.now(), promise });
    return promise;
  },
};