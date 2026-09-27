// GA4 and Meta Pixel now live as tags inside the GTM container (each with its own
// consent requirement configured in the GTM UI). This file only pushes events to
// the dataLayer — it never calls gtag()/fbq() directly for tracking calls.
const GA4_ID = process.env.REACT_APP_GA4_MEASUREMENT_ID || 'G-LQ2ZJY49JE';

let initialized = false;

function pushConsentUpdate(categories) {
  if (!window.gtag) return;
  const analytics = !!categories?.analytics;
  const marketing = !!categories?.marketing;
  window.gtag('consent', 'update', {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
    ad_user_data: marketing ? 'granted' : 'denied',
    ad_personalization: marketing ? 'granted' : 'denied',
    functionality_storage: (analytics || marketing) ? 'granted' : 'denied',
  });
}

// Called on app mount (if consent already exists) or right after the user
// chooses in the cookie banner. Unlocks the Consent Mode v2 signals for GTM
// and enables trackPageView/trackLead from here on.
export function initTrackers(categories) {
  pushConsentUpdate(categories);
  if (initialized) return;
  initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'consent_ready', ga4_measurement_id: GA4_ID });
}

export function trackPageView(path) {
  if (!initialized) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'virtual_page_view', page_path: path });
}

export function trackLead(source, role = 'buyer', eventId) {
  if (!initialized) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'lead',
    lead_source: source || 'direto',
    lead_role: role,
    event_id: eventId,
    content_name: role === 'agent' ? 'cadastro_corretor' : 'cadastro_comprador',
    content_category: role === 'agent' ? 'corretor' : 'comprador',
  });
}
