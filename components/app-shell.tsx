import Link from "next/link";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
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
            <Link href="/projects" className="nav-link">
              Projects
            </Link>
            <Link href="/projects/all-about-me" className="button">
              Open Lesson
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
