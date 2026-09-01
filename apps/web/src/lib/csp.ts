/**
 * Content-Security-Policy for the document. Nonce-based in production
 * (`strict-dynamic`); dev needs `unsafe-eval`/`unsafe-inline` for Next's HMR.
 *
 * `style-src 'unsafe-inline'` is intentional: the storefront renderer applies the
 * generated theme through inline `style={}` (validated tokens only, never script).
 */
export function buildCsp(nonce: string, dev: boolean): string {
  const scriptSrc = dev
    ? "'self' 'unsafe-eval' 'unsafe-inline'"
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}
