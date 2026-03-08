/**
 * HTML Content Scanner & Security Wrapper
 */

/**
 * Scan HTML for malicious patterns
 * @param {string} content 
 * @returns {{ safe: boolean, issues: string[] }}
 */
export function scanHtmlFile(content) {
    const issues = [];

    if (!content) return { safe: false, issues: ['Empty content'] };

    // 1. Check for External Script Sources
    // <script src="http..." or <script src="//..."
    if (/<script[^>]+src=["'](http:|https:|\/\/)/i.test(content)) {
        issues.push('External script sources are not allowed.');
    }

    // 2. Check for Cookie Access
    if (/document\.cookie/i.test(content)) {
        issues.push('Access to document.cookie is prohibited.');
    }

    // 3. Check for Malicious Tags (Object, Embed, Applet, Iframe with external src)
    if (/<(object|embed|applet)/i.test(content)) {
        issues.push('Plugins (object, embed, applet) are not allowed.');
    }

    // Check iframe with external src
    const iframeMatch = content.match(/<iframe[^>]+src=["'](http:|https:|\/\/)[^"']*["']/i);
    if (iframeMatch) {
        // Allow if it's strictly specific allowed domains? No, strictly block external iframes for now.
        issues.push('External iframes are not allowed.');
    }

    // 4. Check for Form Actions to external domains
    if (/<form[^>]+action=["'](http:|https:|\/\/)/i.test(content)) {
        issues.push('Forms submitting to external domains are prohibited.');
    }

    // 5. Check for base tag (hijacking relative links)
    if (/<base/i.test(content)) {
        issues.push('Base tag is not allowed (will be injected by system).');
    }

    // 6. Check for meta refresh
    if (/<meta[^>]+http-equiv=["']refresh["']/i.test(content)) {
        issues.push('Meta refresh is prohibited.');
    }

    // 7. Check for eval/Function (crude check, false positives possible but better safe)
    // We mostly care about massive obfuscated blobs, but 'eval(' is a red flag.
    // In a learning simulation, explicit eval might be rare.
    // We'll warn but maybe not BLOCK unless we are very strict.
    // Let's block 'eval(' calls that look executable.
    if (/eval\s*\(/i.test(content)) {
        issues.push('Use of eval() is discouraged and potentially unsafe.');
    }

    return {
        safe: issues.length === 0,
        issues
    };
}

/**
 * Add Security Wrapper to HTML
 * Injects CSP and Base tag
 * @param {string} content 
 * @param {string} simId 
 * @returns {string} Modified HTML
 */
export function addSecurityWrapper(content, simId) {
    // Define strict CSP
    // Allow inline scripts/styles because simulations need them.
    // Block object, base, etc.
    // Use 'self' for images/connect.
    // Note: We might allow more in the future if simulations need to fetch from known APIs.
    const csp = "default-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none';";

    const cspTag = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
    const baseTag = '<base target="_blank">'; // Open links in new tab by default for safety

    // Inject into <head>
    if (/<head>/i.test(content)) {
        return content.replace(/<head>/i, `<head>\n${cspTag}\n${baseTag}`);
    } else if (/<html>/i.test(content)) {
        return content.replace(/<html>/i, `<html>\n<head>${cspTag}\n${baseTag}</head>`);
    } else {
        // No html/head tags? Prepend it.
        return `${cspTag}\n${baseTag}\n${content}`;
    }
}
