import { useFonts } from 'expo-font';
import { Fraunces_300Light, Fraunces_400Regular, Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';

/** Brand type: Fraunces (display) and Inter (text), loaded once at the root. */
export function useBrandFonts(): boolean {
  const [loaded] = useFonts({
    Fraunces_300Light,
    Fraunces_400Regular,
    Fraunces_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  return loaded;
}
