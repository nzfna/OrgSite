import './globals.css';
export const metadata = { title: 'OrgSite — website organisasi tanpa ribet' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id"><body>{children}</body></html>;
}
