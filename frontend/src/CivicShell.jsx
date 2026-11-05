import { createElement } from "react";
import {
  ArrowUpRight,
  Building2,
  Camera,
  Home,
  ListFilter,
  LogIn,
  LogOut,
  MapPin,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const navigation = [
  { to: "/", label: "Home", icon: Home },
  { to: "/issuelist", label: "Issue tracker", icon: ListFilter },
  { to: "/home", label: "Report an issue", icon: Camera },
];

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

export function CivicBrand({ tagline = "CITIZEN PORTAL" }) {
  return (
    <Link
      to="/"
      className="civic-focus flex items-center gap-3"
      aria-label="NagarSeva home"
    >
      <span className="civic-hard-strong flex h-12 w-12 items-center justify-center bg-civic-green text-white">
        <Building2 aria-hidden="true" size={26} />
      </span>
      <span>
        <span className="block font-display text-xl font-extrabold leading-none tracking-tight">
          NAGARSEVA
        </span>
        <span className="mt-1 block font-mono text-[9px] tracking-[.16em] text-civic-ink/60">
          {tagline}
        </span>
      </span>
    </Link>
  );
}

function CivicNavLink({ to, label, icon, count, mobile = false }) {
  const Icon = icon;
  return (
    <NavLink
      to={to}
      end={to === "/"}
      aria-label={mobile ? label : undefined}
      className={({ isActive }) =>
        mobile
          ? `civic-focus flex min-h-11 flex-1 flex-col items-center justify-center gap-1 text-xs ${
              isActive ? "font-bold text-civic-ink" : "text-civic-ink/65"
            }`
          : `civic-focus civic-hard flex min-h-11 items-center gap-3 px-3 py-3 font-semibold transition-transform hover:-translate-y-0.5 ${
              isActive
                ? "civic-hard-strong bg-civic-ink text-white"
                : "bg-white"
            }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex items-center ${
              mobile ? "flex-col gap-1" : "gap-3"
            }`}
          >
            {createElement(Icon, {
              "aria-hidden": true,
              size: mobile ? 20 : 21,
              strokeWidth: 1.8,
            })}
            {!mobile && label}
            {mobile && (
              <span>
                {label === "Issue tracker"
                  ? "Issues"
                  : label === "Report an issue"
                  ? "Report"
                  : label}
              </span>
            )}
          </span>
          {!mobile && isActive && count != null && (
            <span className="ml-auto bg-civic-amber px-2 py-1 font-mono text-xs text-civic-ink">
              {count}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function CivicPublicHeader({
  tagline = "CITIZEN ISSUE DESK",
  activeRoute = "",
  className = "",
}) {
  const navigate = useNavigate();
  const storedToken = localStorage.getItem("user");
  const isLoggedIn = storedToken ? !isTokenExpired(storedToken) : false;
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("user_id");
    navigate("/login");
  };

  return (
    <header
      className={`flex flex-wrap items-center justify-between gap-4 border-b-[3px] border-civic-ink bg-civic-mint px-5 py-4 sm:px-8 ${className}`}
    >
      <CivicBrand tagline={tagline} />
      <nav
        aria-label="Main navigation"
        className="flex flex-wrap items-center gap-1 sm:gap-2"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `civic-focus inline-flex min-h-11 items-center gap-2 border-2 px-3 font-display font-semibold ${
              isActive || activeRoute === "/"
                ? "border-civic-ink bg-civic-ink text-white"
                : "border-transparent hover:border-civic-ink"
            }`
          }
        >
          <Home size={18} aria-hidden="true" />
          Home
        </NavLink>
        <NavLink
          to="/issuelist"
          className={({ isActive }) =>
            `civic-focus inline-flex min-h-11 items-center gap-2 border-2 px-3 font-display font-semibold ${
              isActive || activeRoute === "/issuelist"
                ? "border-civic-ink bg-civic-ink text-white"
                : "border-transparent hover:border-civic-ink"
            }`
          }
        >
          <ListFilter size={18} aria-hidden="true" />
          Issues
        </NavLink>
        {isLoggedIn ? (
          <button
            type="button"
            onClick={handleLogout}
            className="civic-focus inline-flex min-h-11 items-center gap-2 border-[3px] border-civic-ink bg-civic-ink px-3 font-display font-bold text-white"
          >
            <LogOut size={17} aria-hidden="true" />
            Log out
          </button>
        ) : (
          <NavLink
            to={activeRoute === "/signup" ? "/signup" : "/login"}
            className={({ isActive }) =>
              `civic-focus inline-flex min-h-11 items-center gap-2 border-[3px] border-civic-ink px-3 font-display font-bold ${
                isActive ||
                activeRoute === "/login" ||
                activeRoute === "/signup"
                  ? "bg-civic-ink text-white"
                  : "bg-white"
              }`
            }
          >
            <LogIn size={17} aria-hidden="true" />
            {activeRoute === "/signup" ? "Sign up" : "Log in"}
          </NavLink>
        )}
      </nav>
    </header>
  );
}

export function CivicPublicFooter({ children = "REPORT · TRACK · RESOLVE" }) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t-[3px] border-civic-ink bg-civic-mint px-5 py-3 sm:px-8">
      <span className="font-mono text-[9px] tracking-wider">
        NAGARSEVA · JHARKHAND
      </span>
      <span className="font-mono text-[9px] tracking-[.1em] text-civic-ink/55">
        {children}
      </span>
    </footer>
  );
}

export default function CivicShell({
  title,
  subtitle,
  eyebrow = "NagarSeva / Public dashboard",
  query,
  onQueryChange,
  totalIssues,
  openCount,
  inProgressCount,
  closedCount,
  children,
  headerAction,
  tagline = "CITIZEN PORTAL",
}) {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem("user"));
  const userId = localStorage.getItem("user_id");
  const username = localStorage.getItem("username");
  const initials = userId ? userId.slice(0, 1).toUpperCase() : "G";
  const storedToken = localStorage.getItem("user");
  const isValidSession = storedToken ? !isTokenExpired(storedToken) : false;

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("user_id");
    navigate("/login");
  };

  return (
    <div className="app-shell flex min-h-screen bg-civic-mint text-civic-ink">
      <aside className="sidebar sticky top-0 flex h-screen w-[250px] shrink-0 flex-col border-r-[3px] border-civic-ink bg-civic-mint px-5 py-6">
        <div className="mb-10">
          <CivicBrand tagline={tagline} />
        </div>
        <p className="civic-eyebrow mb-3 px-2 text-civic-ink/50">Your city</p>
        <nav aria-label="Main navigation" className="flex flex-col gap-3">
          {navigation.map((item) => (
            <CivicNavLink
              key={item.to}
              {...item}
              count={item.to === "/issuelist" ? openCount : undefined}
            />
          ))}
        </nav>
        {totalIssues != null && (
          <section
            aria-label="Community issue summary"
            className="civic-hard mt-9 bg-white p-4"
          >
            <p className="civic-eyebrow text-civic-ink/55">Community pulse</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <strong className="font-mono text-3xl font-bold">
                {totalIssues}
              </strong>
              <span className="mb-1 text-xs text-civic-ink/60">
                reports in tracker
              </span>
            </div>
            <div
              className="mt-3 flex h-3 overflow-hidden border-2 border-civic-ink"
              aria-label={`${openCount} open, ${inProgressCount} in progress, ${closedCount} closed`}
            >
              <span
                className="bg-civic-green"
                style={{ flex: openCount || 0.0001 }}
              />
              <span
                className="bg-civic-amber"
                style={{ flex: inProgressCount || 0.0001 }}
              />
              <span
                className="bg-civic-ink"
                style={{ flex: closedCount || 0.0001 }}
              />
            </div>
            <div className="mt-2 flex justify-between gap-2 font-mono text-[9px] text-civic-ink/55">
              <span>OPEN {openCount}</span>
              <span>CLOSED {closedCount}</span>
            </div>
          </section>
        )}
        <div className="mt-auto pt-8">
          <p className="civic-eyebrow mb-2 px-2 text-civic-ink/50">
            Service area
          </p>
          <div className="civic-hard flex min-h-11 items-center gap-2 bg-white px-3 py-2 text-sm font-semibold">
            <MapPin size={17} className="text-civic-green" aria-hidden="true" />
            Jharkhand
          </div>
          <div className="mt-5 flex items-center gap-3 border-t-2 border-civic-ink/20 pt-4">
            <span
              className="flex h-10 w-10 items-center justify-center border-2 border-civic-ink bg-civic-amber font-bold"
              aria-hidden="true"
            >
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-bold"
                title={isLoggedIn ? username || "Citizen account" : "Guest visitor"}
              >
                {isLoggedIn ? username || "Citizen account" : "Guest"}
              </p>
              <p className="font-mono text-[9px] text-civic-ink/55">
                {isLoggedIn ? "SIGNED IN" : "PUBLIC ACCESS"}
              </p>
            </div>
            {isValidSession ? (
              <button
                type="button"
                onClick={handleLogout}
                className="civic-focus p-2"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={17} />
              </button>
            ) : (
              <Link
                to="/login"
                className="civic-focus inline-flex items-center gap-1 p-2 text-xs font-semibold underline"
                aria-label="Log in"
                title="Log in"
              >
                <LogIn size={16} /> Log in
              </Link>
            )}
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 pb-20 lg:pb-0">
        <header className="header-inner flex items-center justify-between gap-6 border-b-[3px] border-civic-ink px-8 py-5">
          <div className="min-w-0">
            <p className="civic-eyebrow text-civic-ink/50">{eyebrow}</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 font-mono text-[10px] text-civic-ink/55">
                {subtitle}
              </p>
            )}
          </div>
          <div className="header-actions flex items-center gap-3">
            {onQueryChange && (
              <label className="search-box civic-hard flex h-11 w-[300px] items-center gap-2 bg-white px-3">
                <ListFilter aria-hidden="true" size={18} />
                <span className="sr-only">Search issues</span>
                <input
                  aria-label="Search issues"
                  type="search"
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Search issue or location…"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-civic-ink/45"
                />
                <kbd className="border border-civic-ink px-1 font-mono text-[9px]">
                  ⌘ K
                </kbd>
              </label>
            )}
            {headerAction || (
              <Link
                to="/home"
                className="civic-focus civic-hard-strong inline-flex h-11 items-center justify-center whitespace-nowrap bg-civic-ink px-4 font-display font-bold text-white transition-transform hover:-translate-y-0.5"
              >
                <span aria-hidden="true" className="mr-1">
                  +
                </span>{" "}
                Report issue{" "}
                <ArrowUpRight aria-hidden="true" size={16} className="ml-1" />
              </Link>
            )}
          </div>
        </header>
        {children}
        <nav
          aria-label="Mobile navigation"
          className="mobile-nav fixed inset-x-0 bottom-0 z-50 hidden justify-around border-t-[3px] border-civic-ink bg-civic-mint px-2 py-2"
        >
          {navigation.map((item) => (
            <CivicNavLink key={item.to} {...item} mobile />
          ))}
        </nav>
      </main>
    </div>
  );
}
