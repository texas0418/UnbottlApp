import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as StoreReview from 'expo-store-review';

// App Store rating / review prompts.
//
// Two entry points:
//  - askForReviewNow()   explicit user action ("Rate Unbottl" in Settings)
//  - maybeAskForReview() automatic, throttled prompt after a positive moment
//
// Apple's rules shape the design: the native prompt (SKStoreReviewController)
// can't be triggered on demand from a button — iOS decides whether to show it
// and caps it at ~3 per year — so the explicit button opens the App Store
// review page instead, and the automatic path uses the native prompt.

const APP_STORE_ID = '6758069630';
export const APP_STORE_REVIEW_URL = `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;

const COUNT_KEY = '@unbottl_review_positive_actions';
const LAST_PROMPT_KEY = '@unbottl_review_last_prompt';

// Prompt after this many positive actions, then again much later. Deliberately
// not on first launch — the user needs enough of the app to have an opinion.
const PROMPT_AT_COUNTS = [5, 30];
// Never prompt twice inside this window, even if a threshold is hit again.
const MIN_DAYS_BETWEEN_PROMPTS = 120;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Open the App Store review page. Used for the explicit "Rate Unbottl" action,
 * where the user asked for it and expects something to happen.
 */
export async function askForReviewNow(): Promise<void> {
  // Prefer the store's own review UI when the platform exposes it.
  const url = (await StoreReview.storeUrl()) ?? APP_STORE_REVIEW_URL;
  await Linking.openURL(url.includes('action=write-review') ? url : APP_STORE_REVIEW_URL);
}

/**
 * Record a positive moment (saved a drink, finished a menu scan, …) and let iOS
 * show its native rating prompt if the user has hit a threshold and hasn't been
 * asked recently. Safe to call often; it never throws and never blocks the UI.
 */
export async function maybeAskForReview(): Promise<void> {
  try {
    if (!(await StoreReview.isAvailableAsync())) return;

    const count = Number(await AsyncStorage.getItem(COUNT_KEY)) + 1 || 1;
    await AsyncStorage.setItem(COUNT_KEY, String(count));
    if (!PROMPT_AT_COUNTS.includes(count)) return;

    const last = Number(await AsyncStorage.getItem(LAST_PROMPT_KEY)) || 0;
    if (last && Date.now() - last < MIN_DAYS_BETWEEN_PROMPTS * DAY_MS) return;

    if (!(await StoreReview.hasAction())) return;

    await AsyncStorage.setItem(LAST_PROMPT_KEY, String(Date.now()));
    await StoreReview.requestReview();
  } catch {
    // A rating prompt is never worth surfacing an error for.
  }
}
