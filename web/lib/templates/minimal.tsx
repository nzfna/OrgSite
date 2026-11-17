import type { ComponentType } from 'react';
import { Reveal } from '../../components/Reveal';
import type { Section, SectionType } from '../types';
type C = ComponentType<{ s: Section }>;

const Hero: C = ({ s }) => { const c = s.content; return (
  <header className="min-hero"><Reveal cfg={s.motion}><h1>{c.title}</h1><p>{c.subtitle}</p>{c.cta && <a className="btn" href="#about">{c.cta}</a>}</Reveal></header>); };
const About: C = ({ s }) => { const c = s.content; return (
  <section className="min-sec" id="about"><Reveal cfg={s.motion}><h2>{c.title}</h2><p>{c.text}</p>
    <dl>{(c.stats ?? []).map((x: any, i: number) => <div key={i}><dt>{x.value}</dt><dd>{x.label}</dd></div>)}</dl></Reveal></section>); };
const Faq: C = ({ s }) => { const c = s.content; return (
  <section className="min-sec"><Reveal cfg={s.motion}><h2>{c.title}</h2>
    {(c.items ?? []).map((x: any, i: number) => <details key={i}><summary>{x.q}</summary><p>{x.a}</p></details>)}</Reveal></section>); };
const Footer: C = ({ s }) => <footer className="min-foot">{s.content.text}</footer>;

export const minimal: Record<SectionType, C> = { hero: Hero, about: About, faq: Faq, footer: Footer };
