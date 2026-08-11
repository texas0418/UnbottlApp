/**
 * Turn an auth failure into something a person can act on.
 *
 * Sign-in with the network off surfaced as a bare "Login failed", which reads
 * as "wrong password" and sends people off to reset a password that was never
 * the problem. Supabase reports an unreachable server as a fetch failure, so
 * that case is separated out and named.
 *
 * Pure and deterministic: no React, no network, no imports.
 */

/** Signatures the platform uses when the request never reached a server. */
const OFFLINE_SIGNATURES = [
  'network request failed', // React Native fetch
  'failed to fetch', // web fetch
  'the internet connection appears to be offline', // iOS NSURLError
  'could not connect to the server',
  'authretryablefetcherror', // supabase-js wrapper
  'networkerror',
  'timeout',
  'timed out',
];

const BAD_CREDENTIALS_SIGNATURES = [
  'invalid login credentials',
  'invalid_credentials',
  'invalid email or password',
];

const UNCONFIRMED_SIGNATURES = ['email not confirmed', 'email_not_confirmed'];

function textOf(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error.toLowerCase();
  const e = error as { message?: unknown; name?: unknown; code?: unknown };
  return [e.message, e.name, e.code]
    .filter((v) => typeof v === 'string')
    .join(' ')
    .toLowerCase();
}

export type AuthFailure = 'offline' | 'credentials' | 'unconfirmed' | 'unknown';

/** Classify without formatting, so the caller can branch if it wants to. */
export function classifyAuthError(error: unknown, fallbackMessage?: string | null): AuthFailure {
  const haystack = `${textOf(error)} ${(fallbackMessage ?? '').toLowerCase()}`;
  if (OFFLINE_SIGNATURES.some((s) => haystack.includes(s))) return 'offline';
  if (BAD_CREDENTIALS_SIGNATURES.some((s) => haystack.includes(s))) return 'credentials';
  if (UNCONFIRMED_SIGNATURES.some((s) => haystack.includes(s))) return 'unconfirmed';
  return 'unknown';
}

export interface AuthErrorCopy {
  title: string;
  message: string;
}

/**
 * @param error            whatever was thrown
 * @param fallbackMessage  a message the auth context may already have captured
 * @param isSignUp         changes the wording, not the diagnosis
 */
export function describeAuthError(
  error: unknown,
  fallbackMessage?: string | null,
  isSignUp = false,
): AuthErrorCopy {
  switch (classifyAuthError(error, fallbackMessage)) {
    case 'offline':
      return {
        title: 'No connection',
        message:
          `Unbottl could not reach the server, so it could not ${isSignUp ? 'create your account' : 'sign you in'}. ` +
          'Check your Wi-Fi or mobile data and try again. Your details were not sent.',
      };
    case 'credentials':
      return {
        title: 'Email or password is wrong',
        message:
          'Check both and try again. If you have forgotten your password, use "Forgot password?" below.',
      };
    case 'unconfirmed':
      return {
        title: 'Confirm your email first',
        message:
          'We sent a confirmation link when the account was created. Open it, then sign in.',
      };
    default:
      return {
        title: isSignUp ? 'Could not create account' : 'Could not sign in',
        message:
          fallbackMessage?.trim() ||
          'Something went wrong. Please try again in a moment.',
      };
  }
}
