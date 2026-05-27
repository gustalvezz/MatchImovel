const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

export function captureUTMs() {
  const params = new URLSearchParams(window.location.search);
  UTM_KEYS.forEach(key => {
    const value = params.get(key);
    if (value) sessionStorage.setItem(key, value);
  });
}

export function getUTMParam(key) {
  return sessionStorage.getItem(key) || '';
}

export function getAllUTMs() {
  return UTM_KEYS.reduce((acc, key) => {
    const value = sessionStorage.getItem(key);
    if (value) acc[key] = value;
    return acc;
  }, {});
}
