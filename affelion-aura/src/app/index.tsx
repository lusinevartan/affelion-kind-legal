import { Redirect } from 'expo-router';
import { useAppState } from '../features/store/AppStore';

export default function Index() {
  const { onboardingDone } = useAppState();
  return <Redirect href={onboardingDone ? '/home' : '/onboarding'} />;
}
