import { Linking } from 'react-native';

/**
 * Public pages the stores require a subscription app to link to, inside the app and in the
 * listing. The pages live at the root of this repository (`aura-privacy.html`,
 * `aura-support.html`). Override the addresses at build time if they move.
 */
const SITE = 'https://lusinevartan.github.io/affelion-kind-legal';

export const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || `${SITE}/aura-privacy.html`;
export const SUPPORT_URL = process.env.EXPO_PUBLIC_SUPPORT_URL || `${SITE}/aura-support.html`;
/** Apple's standard license agreement, unless a custom one is published. */
export const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL || 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export function openLink(url: string): void {
  void Linking.openURL(url).catch(() => undefined);
}
