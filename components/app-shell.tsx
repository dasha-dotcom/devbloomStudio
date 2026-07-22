import Link from "next/link";

export type AppShellNavMode = "public" | "student" | "teacher";

type AppShellProps = {
  children: React.ReactNode;
  navMode?: AppShellNavMode;
};

const getNavConfig = (navMode: AppShellNavMode) => {
  switch (navMode) {
    case "student":
      return {
        secondaryHref: "/student/projects",
        secondaryLabel: "Student Projects",
        primaryHref: "/student/projects",
        primaryLabel: "Student Projects",
      };
    case "teacher":
      return {
        secondaryHref: "/teacher",
        secondaryLabel: "Dashboard",
        primaryHref: "/teacher",
        primaryLabel: "Dashboard",
      };
    case "public":
    default:
      return {
        secondaryHref: "/projects",
        secondaryLabel: "Projects",
        primaryHref: "/teacher",
        primaryLabel: "Teacher Dashboard",
      };
  }
};

export function AppShell({ children, navMode = "public" }: AppShellProps) {
  const nav = getNavConfig(navMode);

  return (
    <div className="page">
      <div className="shell">
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="brand-mark" aria-hidden />
            <span className="brand-name">DevBloom Studio</span>
          </Link>
          <nav className="nav">
            <Link href="/" className="nav-link">
              Home
            </Link>
            {navMode === "public" ? (
              <Link href={nav.secondaryHref} className="nav-link">
                {nav.secondaryLabel}
              </Link>
            ) : null}
            {navMode === "public" ? (
              <Link href="/teachers" className="nav-link">
                For Teachers
              </Link>
            ) : null}
            {navMode === "public" ? (
              <Link href="/join" className="nav-link">
                Join Class
              </Link>
            ) : null}
            <Link
              href={nav.primaryHref}
              className={navMode === "public" ? "nav-link" : "button"}
            >
              {nav.primaryLabel}
            </Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <span>DevBloom Studio</span>
          <a href="https://tin.computer" className="tin-credit">
            <span className="tin-mark" aria-hidden />
            Growth by Tin
          </a>
        </footer>
      </div>
    </div>
  );
}
