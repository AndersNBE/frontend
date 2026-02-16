import Link from "next/link";

const footerColumns = [
  {
    title: "Drift og ansvar",
    links: [
      { label: "Driftsstatus", href: "/legal/status" },
      { label: "Spil med omtanke", href: "/legal/omtanke" },
      { label: "Sunde spillevaner", href: "/legal/vaner" },
      { label: "Rofus", href: "/legal/rofus" },
      { label: "Spilleregler", href: "/legal/rules" },
      { label: "Sletning/indsigt i data", href: "/legal/data" },
      { label: "Whistleblower", href: "/legal/whistleblower" },
    ],
  },
  {
    title: "Vilkår",
    links: [
      { label: "Vinderchancer", href: "/legal/odds" },
      { label: "Cookies", href: "/legal/cookies" },
      { label: "Forhandlere", href: "/legal/partners" },
      { label: "Kanaloversigt", href: "/legal/channels" },
      { label: "Privatlivspolitik", href: "/legal/privacy" },
      { label: "Webtilgaengelighed", href: "/legal/accessibility" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="footerTop">
        <div className="footerBrand">
          <div className="footerBrandMark">
            <span className="footerBrandIcon">U</span>
            <span className="footerBrandName">Udfall</span>
          </div>
          <div className="footerAddress">
            Udfall Labs A/S
            <br />
            Korsdalsvej 135
            <br />
            2605 Brondby
          </div>
        </div>

        <div className="footerColumns">
          {footerColumns.map((column) => (
            <div key={column.title} className="footerColumn">
              <span className="footerTitle">{column.title}</span>
              <div className="footerLinks">
                {column.links.map((link) => (
                  <Link key={link.href} href={link.href} className="footerLink">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="footerSupport">
          <span className="footerTitle">Kontakt vores kundeservice</span>
          <span className="footerSupportText">Alle dage fra 10-20</span>
          <Link href="/help" className="footerSupportButton">
            Brug for hjaelp?
          </Link>
        </div>
      </div>

      <div className="footerCare">
        <div className="footerCareInner">
          <div className="footerCareHeader">
            <h3>Spil med omtanke</h3>
            <p>
              Spil aldrig for mere, end du har raad til at tabe og husk at tage pause.{" "}
              <Link href="/legal/omtanke">Laes mere her</Link>
            </p>
          </div>

          <div className="footerCareGrid">
            <div className="footerCareCard">
              <div className="footerCareIcon">18+</div>
              <p>Du skal vaere over 18 aar for at kunne bruge Udfall.</p>
            </div>
            <div className="footerCareCard">
              <div className="footerCareIcon">ROFUS</div>
              <p>Du kan udelukke dig fra spil via ROFUS.</p>
            </div>
            <div className="footerCareCard">
              <div className="footerCareIcon">Stop</div>
              <p>Hjaelp til ansvarligt spil findes hos StopSpillet.</p>
            </div>
            <div className="footerCareCard">
              <div className="footerCareIcon">SM</div>
              <p>Udfall overvages af Spillemyndigheden.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
