import Link from "next/link";

export default function HelpPage() {
  return (
    <section>
      <Link href="/markets" className="backLink">
        <span aria-hidden="true">&lt;-</span>
        <span>Back to markets</span>
      </Link>

      <h1 className="pageTitle">Support</h1>
      <p className="pageSubtitle">Add a short support intro here.</p>

      <div className="marketLayout" style={{ marginTop: 18 }}>
        <div className="marketMain">
          <div className="marketCard">
            <h3>Contact</h3>
            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>Add contact text here.</p>
          </div>

          <div className="marketCard">
            <h3>FAQ</h3>
            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>Add FAQ text here.</p>
          </div>
        </div>

        <aside className="marketSide">
          <div className="marketCard">
            <h3>Opening hours</h3>
            <div className="marketInfoList">
              <div>
                <span>Weekdays</span>
                <strong>Add hours</strong>
              </div>
              <div>
                <span>Weekend</span>
                <strong>Add hours</strong>
              </div>
              <div>
                <span>Response time</span>
                <strong>Add response time</strong>
              </div>
            </div>
          </div>

          <div className="marketCard">
            <h3>Contact channels</h3>
            <div className="marketInfoList">
              <div>
                <span>Email</span>
                <strong>Add email</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>Add phone</strong>
              </div>
              <div>
                <span>Chat</span>
                <strong>Add chat</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
