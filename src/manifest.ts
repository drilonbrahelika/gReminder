/**
 * The extension manifest, written out as dist/manifest.json by the build.
 *
 * Only the `storage` permission, which Chrome installs without a prompt, and
 * no `host_permissions`. The `action` popup lives in Chrome's extensions
 * menu, not in Meet; it holds the one setting, the reminder time. Content
 * scripts declared here only need their `matches`.
 */
const MEET = ['https://meet.google.com/*'];

interface ContentScript {
  matches: string[];
  js: string[];
  run_at: 'document_start' | 'document_end' | 'document_idle';
  world?: 'ISOLATED' | 'MAIN';
}

export interface Manifest {
  manifest_version: 3;
  name: string;
  short_name: string;
  version: string;
  description: string;
  minimum_chrome_version: string;
  icons: Record<string, string>;
  permissions: string[];
  action: { default_title: string; default_popup: string };
  content_scripts: ContentScript[];
}

export function manifest(version: string): Manifest {
  return {
    manifest_version: 3,
    name: 'gReminder: Meeting End Timer for Google Meet',
    short_name: 'gReminder',
    version,
    description:
      'A countdown banner in Google Meet that warns you 5 to 30 minutes before the scheduled end, so meetings finish on time. No sign-in.',
    minimum_chrome_version: '111',
    icons: {
      '16': 'icons/icon16.png',
      '32': 'icons/icon32.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
    permissions: ['storage'],
    action: { default_title: 'gReminder settings', default_popup: 'popup.html' },
    content_scripts: [
      {
        matches: MEET,
        js: ['page.js'],
        run_at: 'document_start',
        world: 'MAIN',
      },
      {
        matches: MEET,
        js: ['content.js'],
        run_at: 'document_idle',
      },
    ],
  };
}
