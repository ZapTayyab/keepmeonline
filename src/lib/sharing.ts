import { sanitizeForm, withoutDeviceIds } from '@/lib/formState';
import type { FormState } from '@/types/calculator';

const SHARE_VERSION = 1;
const MAX_SHARE_PAYLOAD_LENGTH = 8000;
const SHARE_HASH_PREFIX = '#config=';
const SHARE_HASH_PATTERN = /^#config=v(\d+)\.([A-Za-z0-9_-]+)$/;

export type ShareReadResult =
  | { kind: 'none' }
  | { kind: 'ok'; form: FormState }
  | { kind: 'error'; message: string };

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(payload: string): string {
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function buildShareHash(form: FormState): string {
  const payload = toBase64Url(JSON.stringify(withoutDeviceIds(form)));
  return `${SHARE_HASH_PREFIX}v${SHARE_VERSION}.${payload}`;
}

export function buildShareUrl(form: FormState): string {
  return `${window.location.origin}${window.location.pathname}#${buildShareHash(form).slice(1)}`;
}

export function readShareHash(hash: string): ShareReadResult {
  if (!hash.startsWith(SHARE_HASH_PREFIX)) return { kind: 'none' };

  const match = SHARE_HASH_PATTERN.exec(hash);
  if (!match) {
    return { kind: 'error', message: 'This share link is incomplete or damaged.' };
  }
  if (Number(match[1]) !== SHARE_VERSION) {
    return { kind: 'error', message: 'This share link was made by an unsupported version.' };
  }
  const payload = match[2];
  if (payload.length > MAX_SHARE_PAYLOAD_LENGTH) {
    return { kind: 'error', message: 'This share link is too large to load.' };
  }

  try {
    const form = sanitizeForm(JSON.parse(fromBase64Url(payload)));
    if (form === null) {
      return { kind: 'error', message: 'This share link contains settings that could not be read.' };
    }
    return { kind: 'ok', form };
  } catch {
    return { kind: 'error', message: 'This share link is damaged and could not be read.' };
  }
}
