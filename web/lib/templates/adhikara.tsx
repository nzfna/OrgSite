import type { ComponentType } from 'react';
import { Reveal } from '../../components/Reveal';
import type { Section, SectionType } from '../types';
type C = ComponentType<{ s: Section }>;

const Hero: C = ({ s }) => { const c = s.content; return (
  <section className="adh-hero" id="top">
    <Reveal cfg={s.motion}><h1>{c.title}</h1></Reveal>
    <Reveal cfg={s.motion} delay={0.15}><p>{c.subtitle}</p></Reveal>
    {c.cta && <Reveal cfg={s.motion} delay={0.3}><a className="btn" href="#about">{c.cta}</a></Reveal>}
  </section>); };
const About: C = ({ s }) => { const c = s.content; return (
  <section className="adh-sec" id="about">
    <Reveal cfg={s.motion}><h2>{c.title}</h2><p className="lead">{c.text}</p></Reveal>
    <div className="adh-stats">{(c.stats ?? []).map((x: any, i: number) => (
      <Reveal key={i} cfg={s.motion} delay={0.1 * i}><div className="card"><b>{x.value}</b><span>{x.label}</span></div></Reveal>))}</div>
  </section>); };
const Faq: C = ({ s }) => { const c = s.content; return (
  <section className="adh-sec" id="faq">
    <Reveal cfg={s.motion}><h2>{c.title}</h2></Reveal>
    {(c.items ?? []).map((x: any, i: number) => (
      <Reveal key={i} cfg={s.motion} delay={0.08 * i}><details className="card"><summary>{x.q}</summary><p>{x.a}</p></details></Reveal>))}
  </section>); };
const Footer: C = ({ s }) => <footer className="adh-foot">{s.content.text}</footer>;

export const adhikara: Record<SectionType, C> = { hero: Hero, about: About, faq: Faq, footer: Footer };
