export function authRedirect(value: string | null) {
  if (!value || /[\\\r\n]/.test(value)) return '/sessions';
  return /^\/(?:sessions(?:\/book|\/(?:waiting|room)\/[0-9a-fA-F-]{36})?|tasks|my-sessions)(?:\?[^#]*)?$/.test(value) ? value : '/sessions';
}
