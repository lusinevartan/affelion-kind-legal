import { Linking } from 'react-native';

/**
 * Public pages the stores require a subscription app to link to, inside the app and in the
 * listing. Drafts are in docs/store (privacy-policy.md, terms.md, support.md); they are published
 * on affelion.com. Override the addresses at build time if they move.
 */
const SITE = 'https://www.affelion.com/halo';

export const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || `${SITE}/privacy`;
export const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL || `${SITE}/terms`;
export const SUPPORT_URL = process.env.EXPO_PUBLIC_SUPPORT_URL || `${SITE}/support`;

export function openLink(url: string): void {
  void Linking.openURL(url).catch(() => undefined);
}
