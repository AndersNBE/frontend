"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function TopNav() {
  const pathname = usePathname();
  const isMarkets = pathname === "/" || pathname.startsWith("/markets");

  return (
    <header className="topBar">
      <div className="topBarInner">
        <div className="topLeft">
          <Link href="/markets" className="brand">
            <span className="brandIcon">F</span>
            <span className="brandName">Foresee</span>
          </Link>

          <nav className="nav">
            <Link href="/markets" className={cx("navLink", isMarkets && "navLinkActive")}>
              Markets
            </Link>
            <Link href="/markets?cat=politics" className="navLink">
              Politics
            </Link>
            <Link href="/markets?cat=sports" className="navLink">
              Sports
            </Link>
            <Link href="/markets?cat=finance" className="navLink">
              Finance
            </Link>
            <Link href="/markets?cat=entertainment" className="navLink">
              Entertainment
            </Link>
          </nav>
        </div>

        <div className="topRight">
          <div className="topSearch">
            <span className="topSearchIcon" aria-hidden="true">⌕</span>
            <input className="topSearchInput" placeholder="Search markets..." />
          </div>

          <Link href="/signin" className="topTextLink">
            Sign In
          </Link>

          <Link href="/signup" className="btnPrimary">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
