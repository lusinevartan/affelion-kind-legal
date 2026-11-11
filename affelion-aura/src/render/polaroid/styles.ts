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
  classic: { id: 'classic', name: 'Classic', paper: '#FAFAFA', caption: '#2A2A2A', subcaption: '#757575', border: 0.055, bottom: 0.2, cornerRadius: 0.004, pro: false },
  noir: { id: 'noir', name: 'Noir', paper: '#000000', caption: '#FFFFFF', subcaption: 'rgba(255,255,255,0.6)', border: 0.055, bottom: 0.2, cornerRadius: 0.004, pro: true },
  clean: { id: 'clean', name: 'Clean', paper: '#FAFAFA', caption: '#2A2A2A', subcaption: '#757575', border: 0.03, bottom: 0.12, cornerRadius: 0, pro: true },
  film: { id: 'film', name: 'Film', paper: '#DCDCDC', caption: '#2A2A2A', subcaption: '#757575', border: 0.07, bottom: 0.24, cornerRadius: 0.004, pro: true },
};

export const FRAME_STYLE_IDS = Object.keys(FRAME_STYLES) as FrameStyleId[];
