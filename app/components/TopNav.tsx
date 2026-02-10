"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMarkets = pathname === "/" || pathname.startsWith("/markets");
  const topBarInnerRef = useRef<HTMLDivElement>(null);
  const topLeftRef = useRef<HTMLDivElement>(null);
  const topRightRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [navCollapsed, setNavCollapsed] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navCollapsed) setMenuOpen(false);
  }, [navCollapsed]);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setSearch(q);
  }, [searchParams]);

  useLayoutEffect(() => {
    const topBarInner = topBarInnerRef.current;
    const topLeft = topLeftRef.current;
    const topRight = topRightRef.current;
    const brand = brandRef.current;
    const nav = navRef.current;
    if (!topBarInner || !topLeft || !topRight || !brand || !nav) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      if (window.matchMedia("(max-width: 900px)").matches) {
        setNavCollapsed(true);
        return;
      }

      const topBarStyles = window.getComputedStyle(topBarInner);
      const topLeftStyles = window.getComputedStyle(topLeft);
      const gap = parseFloat(topBarStyles.columnGap || topBarStyles.gap || "0") || 0;
      const leftGap =
        parseFloat(topLeftStyles.columnGap || topLeftStyles.gap || "0") || 0;
      const available = topBarInner.clientWidth - topRight.clientWidth - gap;
      const needed = brand.offsetWidth + leftGap + nav.scrollWidth;

      setNavCollapsed(needed > available);
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(topBarInner);
    observer.observe(topRight);
    observer.observe(brand);
    observer.observe(nav);

    window.addEventListener("resize", schedule);
    measure();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

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
      <div
        ref={topBarInnerRef}
        className={cx("topBarInner", navCollapsed && "navCollapsed")}
      >
        <div ref={topLeftRef} className="topLeft">
          <div ref={brandRef}>
            <Link href="/markets" className="brand">
              <span className="brandIcon">F</span>
              <span className="brandName">Foresee</span>
            </Link>
          </div>

          <nav ref={navRef} className="nav">
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

        <div ref={topRightRef} className="topRight">
          <Link href="/signin" className="topTextLink">
            Sign In
          </Link>

          <Link href="/signup" className="btnPrimary">
            Get Started
          </Link>
        </div>
      </div>

      <div className="topSearchRow">
        <form className="topSearch" role="search" onSubmit={handleSearchSubmit}>
          <span className="topSearchIcon" aria-hidden="true">⌕</span>
          <input
            className="topSearchInput"
            placeholder="Search markets..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </form>
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
