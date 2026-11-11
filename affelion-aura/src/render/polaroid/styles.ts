/**
 * Premium frame styles (Pro). Presentation only: the aura itself is never changed by a style,
 * so a portrait stays a faithful translation of the measurements whatever frame it wears.
 */
export type FrameStyleId = 'classic' | 'noir' | 'clean' | 'film';

export interface FrameStyle {
  id: FrameStyleId;
  name: string;
  paper: string;
  caption: string;
  subcaption: string;
  /** Border width as a fraction of card width. */
  border: number;
  /** Bottom margin as a fraction of card width. */
  bottom: number;
  cornerRadius: number;
  pro: boolean;
}

export const FRAME_STYLES: Record<FrameStyleId, FrameStyle> = {
  classic: { id: 'classic', name: 'Classic', paper: '#F6F3E3', caption: '#2A2724', subcaption: 'rgba(42,39,36,0.6)', border: 0.055, bottom: 0.2, cornerRadius: 0.008, pro: false },
  noir: { id: 'noir', name: 'Noir', paper: '#141614', caption: '#F6F3E3', subcaption: 'rgba(246,243,227,0.6)', border: 0.055, bottom: 0.2, cornerRadius: 0.008, pro: true },
  clean: { id: 'clean', name: 'Clean', paper: '#F6F3E3', caption: '#2A2724', subcaption: 'rgba(42,39,36,0.6)', border: 0.03, bottom: 0.12, cornerRadius: 0.02, pro: true },
  film: { id: 'film', name: 'Film', paper: '#EFE6D3', caption: '#3A2E26', subcaption: 'rgba(58,46,38,0.6)', border: 0.07, bottom: 0.24, cornerRadius: 0.004, pro: true },
};

export const FRAME_STYLE_IDS = Object.keys(FRAME_STYLES) as FrameStyleId[];
