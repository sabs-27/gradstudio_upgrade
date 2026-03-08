/**
 * Response Helpers
 * Standardized JSON response format
 */
export function jsonResponse(data, status = 200, corsHeaders = {}) {
    // Check if data has an 'error' field and wrap appropriately if needed
    // Or if it's a success response.
    // The existing project standard seems to be:
    // Success: { success: true, ...data } or just pure data?
    // Looking at index.js, it varies, but often `jsonResponse({ success: true, ... })`

    // We'll just return headers + JSON stringify
    // Added Cache-Control: no-cache to ensure fresh data always
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });
}
