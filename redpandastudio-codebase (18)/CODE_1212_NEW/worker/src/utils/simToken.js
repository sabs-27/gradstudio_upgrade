/**
 * Simulation access token utilities
 * Generates and verifies short-lived HMAC tokens for simulation content protection.
 * No login required — tokens are session-based and expire in 5 minutes.
 */

const TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a short-lived token for accessing a simulation
 * @param {string} simPath - The simulation file path (e.g. "simulations/java/intro/index.html")
 * @param {object} env - Worker env (needs SIM_TOKEN_SECRET or JWT_SECRET as fallback)
 * @returns {Promise<string>} - The token string (base64url encoded)
 */
export async function generateSimToken(simPath, env) {
  const secret = env.SIM_TOKEN_SECRET || env.JWT_SECRET;
  const expires = Date.now() + TOKEN_EXPIRY_MS;
  const payload = `${simPath}|${expires}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  // Token format: base64url(expires:signature)
  const tokenData = `${expires}.${sigB64}`;
  return tokenData;
}

/**
 * Verify a simulation access token
 * @param {string} token - The token to verify
 * @param {string} simPath - The simulation path it should be valid for
 * @param {object} env - Worker env
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function verifySimToken(token, simPath, env) {
  if (!token) return { valid: false, error: 'missing_token' };

  try {
    const dotIdx = token.indexOf('.');
    if (dotIdx === -1) return { valid: false, error: 'malformed_token' };

    const expires = parseInt(token.substring(0, dotIdx), 10);
    const sigB64 = token.substring(dotIdx + 1);

    // Check expiry
    if (Date.now() > expires) return { valid: false, error: 'expired_token' };

    // Recreate the expected signature
    const secret = env.SIM_TOKEN_SECRET || env.JWT_SECRET;
    const payload = `${simPath}|${expires}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const expectedSig = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(payload)
    );

    const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(expectedSig)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    if (sigB64 !== expectedB64) return { valid: false, error: 'invalid_signature' };

    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'verification_failed' };
  }
}
