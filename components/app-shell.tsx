import Link from "next/link";
import { getAllProjects, getProjectHref } from "@/lib/projects";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const defaultProject = getAllProjects()[0];

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
            <Link href={getProjectHref(defaultProject.slug)} className="button">
              Open Lesson
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
