import { createElement, useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Camera, CheckCircle2, MapPin, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import CivicShell from './CivicShell';

const steps = [
  { title: 'Snap & Describe', text: 'Take a photo and tell us what is happening where you live.', icon: Camera, tone: 'green' },
  { title: 'Submit Your Report', text: 'Add the location and category, then send your report to the community issue feed.', icon: Send, tone: 'white' },
  { title: 'See It Resolved', text: 'Track updates and see reported issues move forward.', icon: CheckCircle2, tone: 'amber' },
];

const statusTone = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'open') return 'bg-civic-green text-white';
  if (value === 'in progress') return 'bg-civic-amber text-civic-ink';
  if (value === 'closed') return 'bg-civic-ink text-white';
  return 'bg-civic-mint text-civic-ink';
};

export default function LandingPage() {
  const [issues, setIssues] = useState([]);
  const [issueCount, setIssueCount] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const baseUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    let active = true;
    axios
      .get(`${baseUrl}/api/issues`)
      .then((response) => {
        if (!active) return;
        const records = Array.isArray(response.data?.issues)
          ? response.data.issues
          : Array.isArray(response.data)
          ? response.data
          : [];
        setIssues(records.slice(0, 3));
        setIssueCount(records.length);
      })
      .catch(() => {
        if (active) setIssueCount(null);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [baseUrl]);

  return (
    <CivicShell
      title="Your neighbourhood, heard."
      eyebrow="Jharkhand · Citizen services"
      tagline="CITIZEN DESK · JH"
      headerAction={
        <Link
          to={localStorage.getItem('user') ? '/home' : '/login'}
          className="civic-focus civic-hard-strong inline-flex min-h-11 items-center gap-2 bg-civic-ink px-4 font-display text-sm font-bold text-white"
        >
          Log in <ArrowUpRight aria-hidden="true" size={16} />
        </Link>
      }
    >
      <div className="landing-wrap mx-auto max-w-[1320px] p-8">
        <section className="landing-hero grid grid-cols-[1.15fr_.85fr] items-stretch gap-7">
          <div className="civic-hard-strong relative overflow-hidden bg-white p-9">
            <span className="civic-pill inline-flex items-center gap-2 bg-civic-mint px-3 py-2">
              <MapPin size={14} aria-hidden="true" />Local voices. Real change.
            </span>
            <span className="ml-3 font-mono text-[9px] text-civic-ink/50">01 / WELCOME</span>
            <h2 className="hero-title mt-6 max-w-[640px] font-display text-[66px] font-black leading-[.98]">
              Report.
              <br />
              <span className="text-civic-green">Track.</span>
              <br />
              Resolve.
            </h2>
            <p className="mt-6 max-w-[510px] text-[17px] leading-7 text-civic-ink/80">
              Your voice for a better Jharkhand. Tell us what needs attention in your neighbourhood, follow its
              progress, and help make everyday places better for everyone.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                to="/home"
                className="civic-focus civic-hard-strong inline-flex min-h-12 items-center gap-3 bg-civic-green px-6 py-4 font-display font-bold text-white transition-transform hover:-translate-y-0.5"
              >
                Report an Issue Now <ArrowRight aria-hidden="true" size={19} />
              </Link>
              <Link
                to="/issuelist"
                className="civic-focus inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4"
              >
                Explore community issues <ArrowDownRight aria-hidden="true" size={16} />
              </Link>
            </div>
            <p className="mt-7 font-mono text-[9px] tracking-[.12em] text-civic-ink/50">
              A SIMPLE WAY TO MAKE YOUR CONCERN COUNT
            </p>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-8 -right-5 font-display text-[145px] font-black leading-none text-civic-mint/60"
            >
              ⌂
            </div>
          </div>

          <section
            aria-label="Community snapshot"
            className="community-snapshot paper-grid civic-hard-strong flex min-h-[390px] flex-col justify-between p-6"
          >
            <div className="flex items-center justify-between">
              <span className="civic-eyebrow">Community snapshot</span>
              <span className="civic-pill bg-white px-3 py-1.5">Live feed</span>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[.12em] text-civic-ink/55">
                REPORTS SHARED BY RESIDENTS
              </p>
              <div className="mt-2 font-display text-[76px] font-black leading-none">
                {issueCount ?? '—'}
                {issueCount != null && <span className="text-civic-green">+</span>}
              </div>
              {issueCount == null && (
                <p className="mt-2 font-mono text-[10px] tracking-[.1em] text-civic-ink/50">
                  LIVE COUNT UNAVAILABLE
                </p>
              )}
              <div className="mt-5 h-[3px] w-full bg-civic-ink" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="border-2 border-civic-ink bg-white p-3">
                  <p className="civic-eyebrow text-civic-ink/55">Showing</p>
                  <p className="mt-1 font-display text-2xl font-bold">{issues.length}</p>
                  <p className="text-xs text-civic-ink/65">recent reports</p>
                </div>
                <div className="border-2 border-civic-ink bg-civic-amber p-3">
                  <p className="civic-eyebrow">Status</p>
                  <p className="mt-1 font-display text-2xl font-bold">{issues.length ? 'Live' : 'Open'}</p>
                  <p className="text-xs">Community feed</p>
                </div>
              </div>
            </div>
            <p className="font-mono text-[9px] tracking-[.12em] text-civic-ink/55">
              EVERY REPORT MOVES US FORWARD
            </p>
          </section>
        </section>

        <section aria-labelledby="how-heading" className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="civic-eyebrow text-civic-ink/55">Three steps · one better community</p>
              <h3 id="how-heading" className="mt-1 font-display text-[27px] font-bold">
                From concern to change.
              </h3>
            </div>
            <span className="civic-pill shrink-0 bg-white px-3 py-1.5">How it works</span>
          </div>
          <div className="steps grid grid-cols-3 gap-4">
            {steps.map(({ title, text, icon, tone }, index) => (
              <article
                key={title}
                className={`civic-hard p-5 ${
                  tone === 'green'
                    ? 'bg-civic-green text-white'
                    : tone === 'amber'
                    ? 'bg-civic-amber text-civic-ink'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] opacity-75">STEP 0{index + 1}</span>
                  {createElement(icon, { 'aria-hidden': true, size: 28 })}
                </div>
                <h4 className="mt-5 font-display text-xl font-bold">{title}</h4>
                <p className="mt-2 text-sm leading-5 opacity-85">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="civic-hard-strong mt-8 overflow-hidden bg-white">
          <div className="flex items-center justify-between gap-4 border-b-[3px] border-civic-ink px-5 py-4">
            <div>
              <p className="civic-eyebrow text-civic-ink/55">From your community</p>
              <h3 className="mt-1 font-display text-xl font-bold">Recent issues</h3>
            </div>
            <Link to="/issuelist" className="civic-focus shrink-0 text-sm font-semibold underline underline-offset-4">
              View all issues <ArrowRight size={15} className="inline" aria-hidden="true" />
            </Link>
          </div>
          {issues.length ? (
            <div className="recent-grid grid grid-cols-3 divide-x-2 divide-civic-ink">
              {issues.map((issue) => (
                <article key={issue.id} className="min-w-0 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="civic-pill truncate bg-civic-mint px-2 py-1">
                      {issue.category || 'Community report'}
                    </span>
                    <time className="shrink-0 font-mono text-[9px] text-civic-ink/55">
                      {issue.created_at
                        ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
                            new Date(issue.created_at),
                          )
                        : ''}
                    </time>
                  </div>
                  <h4 className="mt-4 line-clamp-2 font-display text-lg font-bold">
                    {issue.issue_title || 'Untitled issue'}
                  </h4>
                  <p className="mt-1 flex items-center gap-1 text-sm text-civic-ink/65">
                    <MapPin size={14} aria-hidden="true" />
                    {issue.location || 'Location not provided'}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-2">
                    <span className={`civic-pill px-2 py-1 ${statusTone(issue.status)}`}>{issue.status || 'Unknown'}</span>
                    <span className="font-mono text-[10px] text-civic-ink/60">
                      ↑ {Number(issue.upvotes?.count) || 0}
                    </span>
                  </div>
                  <Link
                    to="/issue-detail"
                    state={{ issueId: issue.id }}
                    className="civic-focus mt-3 inline-flex min-h-10 items-center text-sm font-semibold underline"
                  >
                    View details <ArrowUpRight size={14} className="ml-1" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-5 text-sm text-civic-ink/65">
              {loaded && issueCount === 0
                ? 'No community reports have been submitted yet.'
                : 'Community reports will appear here when available.'}
            </div>
          )}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-2 py-5 font-mono text-[9px] text-civic-ink/55">
          <span>NAGARSEVA · CITIZEN ISSUE REPORTING</span>
          <span>REPORT WHAT MATTERS IN YOUR COMMUNITY</span>
        </footer>
      </div>
    </CivicShell>
  );
}
