import type { Org } from './types';
export const THEMES: Record<string, Org['theme']> = {
  adhikara: { primary: '#1d4ed8', bg: '#f5f8ff', text: '#0f172a', font: 'Inter, system-ui, sans-serif', radius: 16, dark: false },
  minimal: { primary: '#b45309', bg: '#fffdf8', text: '#1c1917', font: 'Georgia, serif', radius: 4, dark: false },
};
export const TEMPLATE_LIST = [
  { key: 'adhikara', name: 'Adhikara', desc: 'Tipografi besar, animasi masuk yang tegas. Cocok untuk himpunan dan BEM.' },
  { key: 'minimal', name: 'Minimal', desc: 'Tata letak editorial yang tenang. Cocok untuk komunitas dan UKM.' },
];
export function sampleOrg(template = 'adhikara'): Org {
  const m = (preset: any) => ({ preset, duration: 0.6 });
  return { name: 'Himpunan Contoh', slug: 'demo', template, theme: THEMES[template] ?? THEMES.adhikara, sections: [
    { id: 'hero', type: 'hero', visible: true, motion: m('fade-up'), content: { title: 'Himpunan Contoh', subtitle: 'Wadah kreativitas dan kolaborasi anggota.', cta: 'Kenali kami' } },
    { id: 'about', type: 'about', visible: true, motion: m('slide-left'), content: { title: 'Tentang kami', text: 'Ceritakan siapa kalian, apa tujuannya, dan apa yang dikerjakan.', stats: [{ value: '2020', label: 'Berdiri' }, { value: '5', label: 'Divisi' }, { value: '20+', label: 'Program' }] } },
    { id: 'faq', type: 'faq', visible: true, motion: m('fade-up'), content: { title: 'Pertanyaan umum', items: [{ q: 'Bagaimana cara bergabung?', a: 'Ikuti open recruitment setiap tahun.' }, { q: 'Apakah ada iuran?', a: 'Tidak ada iuran bulanan.' }] } },
    { id: 'footer', type: 'footer', visible: true, motion: m('none'), content: { text: '© 2026 Himpunan Contoh' } },
  ] };
}
