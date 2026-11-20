/** Permissions (launch/STATUS.md, M8): the listing's wording, and nothing the app does not use. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const app = JSON.parse(readFileSync(join(__dirname, '../app.json'), 'utf8')).expo;
const listing = readFileSync(join(__dirname, '../launch/APP-STORE-LISTING.md'), 'utf8');
const plugin = (name: string) => app.plugins.find((p: unknown) => Array.isArray(p) && p[0] === name)?.[1];

describe('permission text', () => {
  it.each([
    ['NSCameraUsageDescription', 'NSCameraUsageDescription'],
    ['NSMicrophoneUsageDescription', 'NSMicrophoneUsageDescription'],
    ['NSPhotoLibraryAddUsageDescription', 'NSPhotoLibraryAddUsageDescription'],
  ])('%s matches the listing and says it stays on the phone where it reads anything', (key) => {
    const text: string = app.ios.infoPlist[key];
    expect(listing).toContain(text);
    if (key !== 'NSPhotoLibraryAddUsageDescription') expect(text).toMatch(/stays? on your phone/);
  });

  it('the camera plugin uses the same words, so iOS and Android agree', () => {
    expect(plugin('expo-camera').cameraPermission).toBe(app.ios.infoPlist.NSCameraUsageDescription);
    expect(plugin('expo-camera').microphonePermission).toBe(app.ios.infoPlist.NSMicrophoneUsageDescription);
  });

  it('asks for no photo-reading permission, only saving', () => {
    expect(plugin('expo-media-library').photosPermission).toBe(false);
    expect(plugin('expo-media-library').granularPermissions).toEqual([]);
    expect(app.android.blockedPermissions).toEqual(expect.arrayContaining(['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.READ_MEDIA_IMAGES', 'android.permission.READ_MEDIA_VIDEO']));
    expect(JSON.stringify(app)).not.toMatch(/LOCATION|CONTACTS|NSContacts|NSLocation/);
  });

  it('a refused camera offers Open Settings', () => {
    expect(readFileSync(join(__dirname, '../src/app/scan.tsx'), 'utf8')).toMatch(/label="Open Settings" onPress=\{\(\) => void Linking\.openSettings\(\)\}/);
  });
});
