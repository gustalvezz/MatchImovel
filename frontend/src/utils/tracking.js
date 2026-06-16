const PIXEL_ID = process.env.REACT_APP_META_PIXEL_ID || '1379931667380470';
const GA4_ID = process.env.REACT_APP_GA4_MEASUREMENT_ID || 'G-LQ2ZJY49JE';

let initialized = false;

export function initTrackers() {
  if (initialized) return;
  initialized = true;

  // GA4
  if (window.gtag) {
    window.gtag('config', GA4_ID, { send_page_view: false });
  }

  // Meta Pixel
  if (window.fbq) {
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }
}

export function trackPageView(path) {
  if (!initialized) return;

  if (window.gtag) {
    window.gtag('event', 'page_view', { page_path: path });
  }
  if (window.fbq) {
    window.fbq('track', 'PageView');
  }
}

export function trackLead(source, role = 'buyer') {
  if (!initialized) return;

  const contentName = role === 'agent' ? 'cadastro_corretor' : 'cadastro_comprador';
  const contentCategory = role === 'agent' ? 'corretor' : 'comprador';

  if (window.gtag) {
    window.gtag('event', 'generate_lead', {
      event_category: 'lead',
      event_label: source || 'direto',
      event_role: role,
    });
  }
  if (window.fbq) {
    window.fbq('track', 'Lead', {
      content_name: contentName,
      content_category: contentCategory,
    });
  }
}
