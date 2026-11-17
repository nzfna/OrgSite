import type { CSSProperties } from 'react';
import { templates } from '../lib/templates';
import type { Org, Theme } from '../lib/types';

const FALLBACK_THEME: Theme = {
  primary: '#2563eb', bg: '#ffffff', text: '#111111',
  font: 'system-ui, sans-serif', radius: 12, dark: false,
};

// Dipakai oleh halaman publik DAN live preview editor, sehingga hasilnya selalu sama.
export function Renderer({ org }: { org: Org }) {
  const T = (templates as any)[org.template] ?? templates.adhikara;
  const t: Theme = { ...FALLBACK_THEME, ...(org.theme || {}) };
  const style = {
    '--primary': t.primary, '--bg': t.bg, '--text': t.text,
    '--radius': `${t.radius}px`, fontFamily: t.font,
  } as CSSProperties;
  const sections = Array.isArray(org.sections) ? org.sections : [];
  return (
    <div className={`site ${org.template}`} data-dark={!!t.dark} style={style}>
      {sections.filter((s) => s && s.visible).map((s) => {
        const C = T[s.type];
        return C ? <C key={s.id} s={s} /> : null;
      })}
    </div>
  );
}
