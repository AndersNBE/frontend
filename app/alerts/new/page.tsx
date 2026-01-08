"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function NewAlertPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const marketId = searchParams.get("market") ?? "";
  const backHref = useMemo(
    () => (marketId ? `/markets/${encodeURIComponent(marketId)}` : "/markets"),
    [marketId],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus("saved");
  };

  return (
    <section className="marketDetailShell">
      <Link href={backHref} className="backLink">
        <span aria-hidden="true">←</span>
        <span>Back to market</span>
      </Link>

      <div>
        <h1 className="pageTitle">Create alert</h1>
        <p className="pageSubtitle">Get notified when a contract hits your target price.</p>
      </div>

      <div className="marketLayout">
        <div className="marketMain">
          <div className="marketCard">
            <div className="marketTicketHeader">
              <h3>Alert details</h3>
              <span className="marketTicketSub">Delivery: email + push</span>
            </div>
            <form className="marketTicketForm" onSubmit={handleSubmit}>
              {error && <div className="marketNotice">{error}</div>}
              {status === "saved" && (
                <div className="marketNotice marketNoticeSuccess">
                  Alert saved. Connect your backend to deliver notifications.
                </div>
              )}

              <label className="marketPriceInput">
                Market
                <input value={marketId || "Selected market"} readOnly />
              </label>

              <div className="marketSelectRow">
                <label>
                  Alert type
                  <select defaultValue="above">
                    <option value="above">Price above</option>
                    <option value="below">Price below</option>
                    <option value="cross">Crosses threshold</option>
                  </select>
                </label>
                <label>
                  Threshold (DKK)
                  <input type="number" min="0.01" max="0.99" step="0.01" defaultValue="0.60" />
                </label>
              </div>

              <div className="marketCheckboxRow">
                <label className="marketCheckbox">
                  <input type="checkbox" defaultChecked />
                  <span>Email</span>
                </label>
                <label className="marketCheckbox">
                  <input type="checkbox" defaultChecked />
                  <span>Push</span>
                </label>
                <label className="marketCheckbox">
                  <input type="checkbox" />
                  <span>SMS</span>
                </label>
              </div>

              <button type="submit" className="marketPrimaryButton">
                Create alert
              </button>
            </form>
          </div>
        </div>

        <aside className="marketSide">
          <div className="marketCard">
            <h3>Preview</h3>
            <div className="marketInfoList">
              <div>
                <span>Trigger</span>
                <strong>Yes price above 0,60 DKK</strong>
              </div>
              <div>
                <span>Frequency</span>
                <strong>Once per move</strong>
              </div>
              <div>
                <span>Window</span>
                <strong>Next 7 days</strong>
              </div>
            </div>
          </div>

          <div className="marketCard">
            <h3>Need help?</h3>
            <div className="marketInfoList">
              <div>
                <span>Tip</span>
                <strong>Combine price + volume alerts for tighter signals.</strong>
              </div>
              <div>
                <span>Support</span>
                <strong>alerts@foresee.ai</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
