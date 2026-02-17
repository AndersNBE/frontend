import Link from "next/link";

const footerColumns = [
  {
    title: "Operations & responsibility",
    links: [
      { label: "System status", href: "/legal/status" },
      { label: "Healthy play habits", href: "/legal/vaner" },
      { label: "Rofus", href: "/legal/rofus" },
      { label: "Rules", href: "/legal/rules" },
      { label: "Data deletion/access", href: "/legal/data" },
      { label: "Whistleblower", href: "/legal/whistleblower" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Winning probabilities", href: "/legal/odds" },
      { label: "Cookies", href: "/legal/cookies" },
      { label: "Partners", href: "/legal/partners" },
      { label: "Channel overview", href: "/legal/channels" },
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Web accessibility", href: "/legal/accessibility" },
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
          <span className="footerTitle">Contact support</span>
          <span className="footerSupportText">Every day from 10:00 to 20:00</span>
          <Link href="/help" className="footerSupportButton">
            Need help?
          </Link>
        </div>
      </div>
    </footer>
  );
}
