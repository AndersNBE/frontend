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
    title: "Overview",
    body: "Add text here.",
  },
  {
    title: "Details",
    body: "Add text here.",
    bullets: ["Add bullet here.", "Add bullet here.", "Add bullet here."],
  },
  {
    title: "Contact",
    body: "Add text here.",
  },
];

const makePage = (title: string, subtitle: string): LegalPageContent => ({
  title,
  subtitle,
  sections: placeholderSections,
});

const legalPages: Record<string, LegalPageContent> = {
  status: makePage("System status", "Add a short intro here."),
  omtanke: makePage("Play responsibly", "Add a short intro here."),
  vaner: makePage("Healthy play habits", "Add a short intro here."),
  rofus: makePage("Rofus", "Add a short intro here."),
  rules: makePage("Rules", "Add a short intro here."),
  data: makePage("Data deletion and access", "Add a short intro here."),
  whistleblower: makePage("Whistleblower", "Add a short intro here."),
  odds: makePage("Winning probabilities", "Add a short intro here."),
  cookies: makePage("Cookies", "Add a short intro here."),
  partners: makePage("Partners", "Add a short intro here."),
  channels: makePage("Channel overview", "Add a short intro here."),
  privacy: makePage("Privacy policy", "Add a short intro here."),
  accessibility: makePage("Web accessibility", "Add a short intro here."),
};

const legalNav = [
  { slug: "status", label: "System status" },
  { slug: "omtanke", label: "Play responsibly" },
  { slug: "vaner", label: "Healthy play habits" },
  { slug: "rofus", label: "Rofus" },
  { slug: "rules", label: "Rules" },
  { slug: "data", label: "Data deletion and access" },
  { slug: "whistleblower", label: "Whistleblower" },
  { slug: "odds", label: "Winning probabilities" },
  { slug: "cookies", label: "Cookies" },
  { slug: "partners", label: "Partners" },
  { slug: "channels", label: "Channel overview" },
  { slug: "privacy", label: "Privacy policy" },
  { slug: "accessibility", label: "Web accessibility" },
];

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = legalPages[slug];

  if (!content) {
    return (
      <section>
        <Link href="/markets" className="backLink">
          <span aria-hidden="true">&lt;-</span>
          <span>Back to markets</span>
        </Link>

        <h1 className="pageTitle">Page not found</h1>
        <p className="pageSubtitle">
          We could not find the requested page. Choose one of the official policies below.
        </p>

        <div className="card">
          <div className="marketInfoList" style={{ marginTop: 0 }}>
            {legalNav.map((item) => (
              <div key={item.slug}>
                <span>Policy</span>
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
        <span>Back to markets</span>
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
            <h3>Other policies</h3>
            <div className="marketInfoList">
              {legalNav.map((item) => (
                <div key={item.slug}>
                  <span>{item.label}</span>
                  <Link className="authLink" href={`/legal/${item.slug}`}>
                    View page
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="marketCard">
            <h3>Document info</h3>
            <div className="marketInfoList">
              <div>
                <span>Version</span>
                <strong>Add version</strong>
              </div>
              <div>
                <span>Last updated</span>
                <strong>Add date</strong>
              </div>
              <div>
                <span>Reviewed by</span>
                <strong>Add name</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
