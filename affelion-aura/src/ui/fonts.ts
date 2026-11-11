import { useFonts } from 'expo-font';
import { Fraunces_300Light, Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { InterTight_300Light, InterTight_400Regular, InterTight_500Medium } from '@expo-google-fonts/inter-tight';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';

/** Specimen type: Inter Tight for words, JetBrains Mono for measurements, Fraunces for the keepsake caption. */
export function useBrandFonts(): boolean {
  const [loaded] = useFonts({
    Fraunces_300Light,
    Fraunces_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    InterTight_300Light,
    InterTight_400Regular,
    InterTight_500Medium,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
  return loaded;
}
