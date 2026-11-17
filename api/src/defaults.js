const m = (preset) => ({ preset, duration: 0.6 });
exports.defaultSections = (name) => [
  { id: 'hero', type: 'hero', visible: true, motion: m('fade-up'), content: { title: name, subtitle: 'Wadah kreativitas dan kolaborasi anggota.', cta: 'Kenali kami' } },
  { id: 'about', type: 'about', visible: true, motion: m('slide-left'), content: { title: 'Tentang kami', text: 'Ceritakan siapa kalian, apa tujuannya, dan apa yang dikerjakan.', stats: [{ value: '2020', label: 'Berdiri' }, { value: '5', label: 'Divisi' }, { value: '20+', label: 'Program' }] } },
  { id: 'faq', type: 'faq', visible: true, motion: m('fade-up'), content: { title: 'Pertanyaan umum', items: [{ q: 'Bagaimana cara bergabung?', a: 'Ikuti open recruitment setiap tahun.' }] } },
  { id: 'footer', type: 'footer', visible: true, motion: m('none'), content: { text: `© ${new Date().getFullYear()} ${name}` } },
];
