import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Map,
  Briefcase,
  GraduationCap,
  ClipboardList,
  Video,
  Sparkles,
} from "lucide-react";

function Sidebar() {
  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Resume Analyzer",
      path: "/resume-analyzer",
      icon: FileText,
    },
    {
      name: "Career Roadmap",
      path: "/roadmap",
      icon: Map,
    },
    {
      name: "Jobs",
      path: "/jobs",
      icon: Briefcase,
    },
    {
      name: "Internships",
      path: "/internships",
      icon: GraduationCap,
    },
    {
      name: "My Applications",
      path: "/applications",
      icon: ClipboardList,
    },
    {
      name: "AI Interview",
      path: "/ai-interview",
      icon: Video,
    },
  ];

  return (
    <aside className="sidebar">

      <div className="logo">
        <div className="logoIcon">
          <Sparkles size={22} />
        </div>

        <div>
          <h2>CareerLens</h2>
          <span>AI Career Copilot</span>
        </div>
      </div>

      <nav>
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "navLink active"
                  : "navLink"
              }
            >
              <Icon size={18} />

              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebarBottom">
        <span>CAREERLENS AI</span>
        <p>
          Build your career with intelligence.
        </p>
      </div>

    </aside>
  );
}

export default Sidebar;
