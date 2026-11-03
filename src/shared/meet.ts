/** Meeting codes look like `abc-defg-hij`. Anything else is not a call page. */
const MEETING_CODE_RE = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

/**
 * The meeting code from a Meet URL path, or null when not on a call page.
 * The code is usually the first segment (`/abc-defg-hij`), but some accounts
 * get a prefix (`/meet/abc-defg-hij`, `/_meet/abc-defg-hij`), so every
 * segment is checked.
 */
export function meetingCode(pathname: string): string | null {
  for (const segment of pathname.split('/')) {
    const code = segment.toLowerCase();
    if (MEETING_CODE_RE.test(code)) return code;
  }
  return null;
}
