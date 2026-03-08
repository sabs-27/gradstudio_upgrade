/**
 * Add Security Headers to a Response
 * @param {Response} response 
 * @returns {Response} New response with security headers
 */
export function addSecurityHeaders(response) {
    const newHeaders = new Headers(response.headers);

    // Content-Security-Policy
    // Restrict sources to self, safe defaults
    // Adapting for API: 'none' for default, but allow connect/img/media if needed.
    // Since this is an API, we can be strict.
    newHeaders.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.gradstudio.org https://accounts.google.com https://www.googleapis.com; frame-src 'self' https://accounts.google.com; base-uri 'self'; form-action 'self'");

    // Prevent MIME sniffing
    newHeaders.set('X-Content-Type-Options', 'nosniff');

    // Clickjacking protection (redundant with CSP frame-ancestors but good for legacy)
    newHeaders.set('X-Frame-Options', 'DENY');

    // XSS Protection (Legacy, but safe to set to 0)
    newHeaders.set('X-XSS-Protection', '0');

    // Referrer Policy
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy (Feature Policy) - locking down browser features
    newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

    // HSTS - Force HTTPS
    newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // DNS Prefetch Control
    newHeaders.set('X-DNS-Prefetch-Control', 'off');

    // Cross Domain Policies (Flash/PDF)
    newHeaders.set('X-Permitted-Cross-Domain-Policies', 'none');

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
    });
}
