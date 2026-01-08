import Link from "next/link";

export default function HelpPage() {
  return (
    <section>
      <Link href="/markets" className="backLink">
        <span aria-hidden="true">&lt;-</span>
        <span>Tilbage til markeder</span>
      </Link>

      <h1 className="pageTitle">Kundeservice</h1>
      <p className="pageSubtitle">Indsaet kort intro til support her.</p>

      <div className="marketLayout" style={{ marginTop: 18 }}>
        <div className="marketMain">
          <div className="marketCard">
            <h3>Kontakt</h3>
            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>Indsaet kontakttekst her.</p>
          </div>

          <div className="marketCard">
            <h3>FAQ</h3>
            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>Indsaet FAQ-tekst her.</p>
          </div>
        </div>

        <aside className="marketSide">
          <div className="marketCard">
            <h3>Aabningstider</h3>
            <div className="marketInfoList">
              <div>
                <span>Hverdage</span>
                <strong>Indsaet tider</strong>
              </div>
              <div>
                <span>Weekend</span>
                <strong>Indsaet tider</strong>
              </div>
              <div>
                <span>Svartid</span>
                <strong>Indsaet svartid</strong>
              </div>
            </div>
          </div>

          <div className="marketCard">
            <h3>Kontaktkanaler</h3>
            <div className="marketInfoList">
              <div>
                <span>Email</span>
                <strong>Indsaet email</strong>
              </div>
              <div>
                <span>Telefon</span>
                <strong>Indsaet telefon</strong>
              </div>
              <div>
                <span>Chat</span>
                <strong>Indsaet chat</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
