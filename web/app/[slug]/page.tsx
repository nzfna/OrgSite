import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Renderer } from '../../components/Renderer';
import type { Org } from '../../lib/types';

export const revalidate = 60;

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
const SLUG_RE = /^[a-z0-9-]{3,40}$/;

async function getOrg(slug: string): Promise<Org | null> {
  if (!API_URL || !SLUG_RE.test(slug)) return null;
  try {
    const res = await fetch(`${API_URL}/public/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const org = (await res.json()) as Org;
    if (!org || typeof org.name !== 'string' || !Array.isArray(org.sections)) return null;
    return org;
  } catch {
    // API mati / URL salah: tampilkan 404, bukan error 500.
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrg(slug);
  return org ? { title: org.name, description: `Situs resmi ${org.name}` } : {};
}

export default async function Site({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getOrg(slug);
  if (!org) notFound();
  return <Renderer org={org} />;
}
