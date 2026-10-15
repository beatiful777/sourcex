import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { LEGAL, type DocId } from "@/lib/legal";

export function LegalPage({ doc }: { doc: DocId }) {
  const { lang } = useI18n();
  const d = LEGAL[lang][doc];
  return (
    <div className="container-page max-w-3xl py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{d.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{d.updated}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
        {d.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p && <p>{s.p}</p>}
            {s.ul && (
              <ul className={s.p ? "mt-2" : undefined}>
                {s.ul.map((it, i) => (
                  <li key={i}>
                    {typeof it === "string" ? it : (<><strong>{it.b}</strong> {it.t}</>)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <section>
          <h2>{d.contact.h}</h2>
          <p>
            {d.contact.pre}
            <Link to="/contact" className="text-primary underline">{d.contact.link}</Link>
            {d.contact.post}
          </p>
        </section>
      </div>
    </div>
  );
}
