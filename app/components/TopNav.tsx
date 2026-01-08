"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMarkets = pathname === "/" || pathname.startsWith("/markets");
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setSearch(q);
  }, [searchParams]);

  const navItems = [
    { href: "/markets", label: "Markets", active: isMarkets },
    { href: "/markets?cat=politics", label: "Politics" },
    { href: "/markets?cat=sports", label: "Sports" },
    { href: "/markets?cat=finance", label: "Finance" },
    { href: "/markets?cat=entertainment", label: "Entertainment" },
  ];

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = search.trim();
    const params = new URLSearchParams();
    const cat = searchParams.get("cat");

    if (cat) params.set("cat", cat);
    if (trimmed) params.set("q", trimmed);

    const queryString = params.toString();
    router.push(queryString ? `/markets?${queryString}` : "/markets");
  };

  return (
    <header className="topBar">
      <div className="topBarInner">
        <div className="topLeft">
          <Link href="/markets" className="brand">
            <span className="brandIcon">F</span>
            <span className="brandName">Foresee</span>
          </Link>

          <nav className="nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cx("navLink", item.active && "navLinkActive")}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            className="navMenuButton"
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-controls="navMenu"
          >
            <span className="navMenuIcon" aria-hidden="true">☰</span>
            <span>Menu</span>
          </button>
        </div>

        <div className="topRight">
          <form className="topSearch" role="search" onSubmit={handleSearchSubmit}>
            <span className="topSearchIcon" aria-hidden="true">⌕</span>
            <input
              className="topSearchInput"
              placeholder="Search markets..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </form>

          <Link href="/signin" className="topTextLink">
            Sign In
          </Link>

          <Link href="/signup" className="btnPrimary">
            Get Started
          </Link>
        </div>
      </div>

      <div id="navMenu" className={menuOpen ? "navMenu navMenuOpen" : "navMenu"}>
        {navItems.map((item) => (
          <Link
            key={`${item.href}-menu`}
            href={item.href}
            className={cx("navMenuLink", item.active && "navMenuLinkActive")}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
