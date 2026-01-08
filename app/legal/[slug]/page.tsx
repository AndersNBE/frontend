import Link from "next/link";

type LegalSection = {
  title: string;
  body: string;
  bullets?: string[];
};

type LegalPageContent = {
  title: string;
  subtitle: string;
  sections: LegalSection[];
};

const placeholderSections: LegalSection[] = [
  {
    title: "Oversigt",
    body: "Indsaet tekst her.",
  },
  {
    title: "Detaljer",
    body: "Indsaet tekst her.",
    bullets: ["Indsaet punkt her.", "Indsaet punkt her.", "Indsaet punkt her."],
  },
  {
    title: "Kontakt",
    body: "Indsaet tekst her.",
  },
];

const makePage = (title: string, subtitle: string): LegalPageContent => ({
  title,
  subtitle,
  sections: placeholderSections,
});

const legalPages: Record<string, LegalPageContent> = {
  status: makePage("Driftsstatus", "Indsaet kort intro her."),
  omtanke: makePage("Spil med omtanke", "Indsaet kort intro her."),
  vaner: makePage("Sunde spillevaner", "Indsaet kort intro her."),
  rofus: makePage("Rofus", "Indsaet kort intro her."),
  rules: makePage("Spilleregler", "Indsaet kort intro her."),
  data: makePage("Sletning og indsigt i data", "Indsaet kort intro her."),
  whistleblower: makePage("Whistleblower", "Indsaet kort intro her."),
  odds: makePage("Vinderchancer", "Indsaet kort intro her."),
  cookies: makePage("Cookies", "Indsaet kort intro her."),
  partners: makePage("Forhandlere", "Indsaet kort intro her."),
  channels: makePage("Kanaloversigt", "Indsaet kort intro her."),
  privacy: makePage("Privatlivspolitik", "Indsaet kort intro her."),
  accessibility: makePage("Webtilgaengelighed", "Indsaet kort intro her."),
};

const legalNav = [
  { slug: "status", label: "Driftsstatus" },
  { slug: "omtanke", label: "Spil med omtanke" },
  { slug: "vaner", label: "Sunde spillevaner" },
  { slug: "rofus", label: "Rofus" },
  { slug: "rules", label: "Spilleregler" },
  { slug: "data", label: "Sletning og indsigt i data" },
  { slug: "whistleblower", label: "Whistleblower" },
  { slug: "odds", label: "Vinderchancer" },
  { slug: "cookies", label: "Cookies" },
  { slug: "partners", label: "Forhandlere" },
  { slug: "channels", label: "Kanaloversigt" },
  { slug: "privacy", label: "Privatlivspolitik" },
  { slug: "accessibility", label: "Webtilgaengelighed" },
];

export default function LegalPage({ params }: { params: { slug: string } }) {
  const content = legalPages[params.slug];

  if (!content) {
    return (
      <section>
        <Link href="/markets" className="backLink">
          <span aria-hidden="true">&lt;-</span>
          <span>Tilbage til markeder</span>
        </Link>

        <h1 className="pageTitle">Side ikke fundet</h1>
        <p className="pageSubtitle">
          Vi kunne ikke finde den oenskede side. Vaelg en af de officielle politikker herunder.
        </p>

        <div className="card">
          <div className="marketInfoList" style={{ marginTop: 0 }}>
            {legalNav.map((item) => (
              <div key={item.slug}>
                <span>Politik</span>
                <Link className="authLink" href={`/legal/${item.slug}`}>
                  {item.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <Link href="/markets" className="backLink">
        <span aria-hidden="true">&lt;-</span>
        <span>Tilbage til markeder</span>
      </Link>

      <h1 className="pageTitle">{content.title}</h1>
      <p className="pageSubtitle">{content.subtitle}</p>

      <div className="marketLayout" style={{ marginTop: 18 }}>
        <div className="marketMain">
          {content.sections.map((section) => (
            <div key={section.title} className="marketCard">
              <h3 style={{ marginTop: 0 }}>{section.title}</h3>
              <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>{section.body}</p>
              {section.bullets && (
                <ul style={{ margin: "10px 0 0 18px", color: "var(--muted)" }}>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <aside className="marketSide">
          <div className="marketCard">
            <h3>Andre politikker</h3>
            <div className="marketInfoList">
              {legalNav.map((item) => (
                <div key={item.slug}>
                  <span>{item.label}</span>
                  <Link className="authLink" href={`/legal/${item.slug}`}>
                    Se siden
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="marketCard">
            <h3>Dokumentinfo</h3>
            <div className="marketInfoList">
              <div>
                <span>Version</span>
                <strong>Indsaet version</strong>
              </div>
              <div>
                <span>Senest opdateret</span>
                <strong>Indsaet dato</strong>
              </div>
              <div>
                <span>Gennemgaet af</span>
                <strong>Indsaet navn</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
