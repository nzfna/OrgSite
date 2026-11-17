export type Preset = 'fade-up' | 'slide-left' | 'zoom' | 'none';
export type MotionCfg = { preset: Preset; duration?: number };
export type SectionType = 'hero' | 'about' | 'faq' | 'footer';
export type Section = { id: string; type: SectionType; variant?: string; visible: boolean; content: any; motion: MotionCfg };
export type Theme = { primary: string; bg: string; text: string; font: string; radius: number; dark: boolean };
export type Org = { name: string; slug: string; template: string; theme: Theme; sections: Section[] };
