import Link from "next/link";

const footerColumns = [
  {
    title: "Drift og ansvar",
    links: [
      { label: "Driftsstatus", href: "/legal/status" },
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
    </footer>
  );
}
