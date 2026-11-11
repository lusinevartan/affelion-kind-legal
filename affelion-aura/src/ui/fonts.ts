import { useFonts } from 'expo-font';
import { InterTight_300Light, InterTight_400Regular, InterTight_500Medium } from '@expo-google-fonts/inter-tight';

/** One family: Inter Tight in three weights. */
export function useBrandFonts(): boolean {
  const [loaded] = useFonts({ InterTight_300Light, InterTight_400Regular, InterTight_500Medium });
  return loaded;
}
