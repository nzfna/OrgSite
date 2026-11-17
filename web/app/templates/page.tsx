import Link from 'next/link';
import { Renderer } from '../../components/Renderer';
import { TEMPLATE_LIST, sampleOrg } from '../../lib/sample';
export default function Templates() {
  return (<div className="pick">{TEMPLATE_LIST.map((t) => (
    <Link key={t.key} href={`/editor?template=${t.key}`}>
      <div className="thumb"><Renderer org={sampleOrg(t.key)} /></div>
      <h3>{t.name}</h3><p>{t.desc}</p>
    </Link>))}</div>);
}
