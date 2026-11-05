import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  MapPin,
  MessageSquareText,
  RefreshCw,
  ThumbsUp,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CivicShell from './CivicShell';

const STATUS_STYLES = {
  open: 'bg-civic-green text-white',
  'in progress': 'bg-civic-amber text-civic-ink',
  closed: 'bg-civic-ink text-white',
};

const normalizeStatus = (status) => String(status || 'unknown').trim().toLowerCase();

const formatDate = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);
  const label = normalized === 'unknown' ? 'Unknown' : normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
  return (
    <span className={`civic-pill inline-flex items-center px-2 py-1 ${STATUS_STYLES[normalized] || 'bg-white text-civic-ink'}`}>
      {label}
    </span>
  );
}

function IssueSkeleton() {
  return (
    <div aria-hidden="true" className="civic-hard bg-white p-5">
      <div className="mb-4 flex gap-2">
        <span className="civic-skeleton h-5 w-28" />
        <span className="civic-skeleton h-5 w-20" />
      </div>
      <div className="civic-skeleton mb-3 h-6 w-3/4" />
      <div className="civic-skeleton mb-6 h-4 w-full" />
      <div className="flex justify-between">
        <span className="civic-skeleton h-9 w-28" />
        <span className="civic-skeleton h-9 w-24" />
      </div>
    </div>
  );
}

function Metric({ label, value, note, tone = 'white' }) {
  const tones = {
    white: 'bg-white text-civic-ink',
    green: 'bg-civic-green text-white',
    amber: 'bg-civic-amber text-civic-ink',
  };
  return (
    <div className={`civic-hard min-w-0 p-4 ${tones[tone]}`}>
      <p className="civic-eyebrow opacity-65">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <strong className="font-display text-3xl font-extrabold leading-none">{value}</strong>
        <span className="text-right font-mono text-[9px] leading-tight opacity-70">{note}</span>
      </div>
    </div>
  );
}

function IssueCard({ issue, featured, currentUserId, onUpvote, onOpen }) {
  const upvotes = issue.upvotes || {};
  const users = Array.isArray(upvotes.users) ? upvotes.users.map(String) : [];
  const count = Number.isFinite(Number(upvotes.count)) ? Number(upvotes.count) : users.length;
  const hasUpvoted = Boolean(currentUserId && users.includes(String(currentUserId)));
  const category = issue.category || 'Uncategorized';
  const title = issue.issue_title || 'Untitled issue';
  const location = issue.location || 'Location not provided';

  return (
    <article
      className={`relative mb-4 grid min-w-0 grid-cols-[minmax(0,1fr)_90px] gap-4 bg-white p-5 transition-transform hover:-translate-y-0.5 ${
        featured ? 'civic-hard-strong' : 'civic-hard'
      }`}
    >
      {featured && (
        <span className="civic-pill absolute -top-3 left-5 max-w-[calc(100%-2rem)] truncate bg-civic-amber px-2 py-1">
          Featured · #{String(issue.id).slice(0, 8)}
        </span>
      )}
      <div className={featured ? 'min-w-0 pt-2' : 'min-w-0'}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="civic-pill max-w-full truncate bg-civic-mint px-2 py-1">{category}</span>
          <StatusBadge status={issue.status} />
          <span className="font-mono text-[10px] text-civic-ink/55">{formatDate(issue.created_at)}</span>
        </div>
        <h3 className={`mt-3 break-words font-display font-bold ${featured ? 'text-xl' : 'text-lg'}`}>{title}</h3>
        {issue.description && (
          <p className="mt-1 line-clamp-2 max-w-[680px] text-sm text-civic-ink/70">{issue.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-civic-ink/70">
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin aria-hidden="true" size={15} className="shrink-0 text-civic-green" />
            <span className="break-words">{location}</span>
          </span>
          {Array.isArray(issue.comments) && (
            <span className="flex items-center gap-1.5">
              <MessageSquareText aria-hidden="true" size={14} />
              {issue.comments.length} comments
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-label={`${hasUpvoted ? 'Remove support from' : 'Support'} ${title}; ${count} votes`}
            aria-pressed={hasUpvoted}
            onClick={() => onUpvote(issue.id)}
            className={`civic-focus civic-hard inline-flex min-h-10 items-center gap-2 px-3 py-2 text-sm font-bold transition-colors ${
              hasUpvoted
                ? 'bg-civic-green text-white'
                : 'bg-civic-mint text-civic-ink hover:bg-civic-green hover:text-white'
            }`}
          >
            <ThumbsUp aria-hidden="true" size={16} />
            {count}
            <span className="font-normal">support</span>
          </button>
          <button
            type="button"
            onClick={() => onOpen(issue.id)}
            className="civic-focus inline-flex min-h-10 items-center gap-1 text-sm font-bold underline underline-offset-4"
          >
            View details <ArrowUpRight aria-hidden="true" size={15} />
          </button>
        </div>
      </div>
      <div className="count-box flex min-w-0 flex-col items-center justify-center border-l-2 border-civic-ink/20 pl-3 text-center">
        {normalizeStatus(issue.status) === 'closed' ? (
          <>
            <span className="civic-eyebrow text-civic-ink/45">Resolved</span>
            <CheckCircle2 aria-label="Resolved" size={28} className="mt-2 text-civic-green" />
            <span className="mt-1 font-mono text-[9px] text-civic-ink/50">CLOSED</span>
          </>
        ) : (
          <>
            <span className="civic-eyebrow text-civic-ink/45">Support</span>
            <strong className="mt-1 font-display text-2xl">{count}</strong>
            <span className="font-mono text-[9px] text-civic-ink/50">VOTES</span>
          </>
        )}
      </div>
    </article>
  );
}

function WorkflowAside({ issues, onOpen }) {
  const mostSupported = [...issues].sort(
    (a, b) => (Number(b.upvotes?.count) || 0) - (Number(a.upvotes?.count) || 0),
  )[0];

  return (
    <aside className="detail-side min-w-0">
      <section className="civic-hard-strong mb-5 bg-civic-ink p-5 text-white">
        <p className="civic-eyebrow text-civic-mint">How it works</p>
        <h2 className="mt-2 font-display text-xl font-bold">From report to resolution</h2>
        <ol className="mt-4 space-y-3">
          {['Neighbours report an issue', 'Teams review and take action', 'Everyone sees the update'].map(
            (step, index) => (
              <li key={step} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center font-bold text-civic-ink ${
                    index === 0 ? 'bg-civic-mint' : index === 1 ? 'bg-civic-amber' : 'bg-civic-green text-white'
                  }`}
                >
                  {index === 2 ? <CheckCircle2 aria-label="Complete" size={17} /> : index + 1}
                </span>
                {step}
              </li>
            ),
          )}
        </ol>
        <Link
          to="/home"
          className="civic-focus mt-5 flex min-h-11 items-center justify-center bg-civic-amber px-3 py-2 text-center font-bold text-civic-ink"
        >
          Report a local issue <ArrowUpRight aria-hidden="true" size={16} className="ml-1" />
        </Link>
      </section>

      {mostSupported ? (
        <section className="civic-hard mb-5 bg-white p-4">
          <p className="civic-eyebrow text-civic-ink/45">Most supported</p>
          <button type="button" onClick={() => onOpen(mostSupported.id)} className="civic-focus mt-1 text-left">
            <span className="font-display text-lg font-bold">{mostSupported.issue_title || 'Untitled issue'}</span>
          </button>
          <p className="mt-2 line-clamp-2 text-sm text-civic-ink/65">
            {mostSupported.description || 'Community members have added their support to this report.'}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-civic-ink/20 pt-3">
            <span className="font-mono text-xs">
              <ThumbsUp aria-hidden="true" size={13} className="mr-1 inline text-civic-green" />
              {Number(mostSupported.upvotes?.count) || 0} SUPPORT
            </span>
            <span className="max-w-1/2 truncate font-mono text-[9px] text-civic-ink/50">
              {mostSupported.location || 'Location unavailable'}
            </span>
          </div>
        </section>
      ) : (
        <section className="civic-hard mb-5 bg-white p-4 text-sm text-civic-ink/65">
          Community highlights will appear when issues are available.
        </section>
      )}

      <section className="civic-hard bg-civic-amber p-4">
        <p className="civic-eyebrow">Your voice matters</p>
        <p className="mt-2 font-display text-lg font-bold">See something that needs fixing?</p>
        <Link
          to="/home"
          className="civic-focus civic-hard mt-3 flex min-h-10 items-center justify-center bg-white px-3 py-2 text-sm font-bold"
        >
          Report an issue <ArrowUpRight aria-hidden="true" size={15} className="ml-1" />
        </Link>
      </section>
    </aside>
  );
}

function EmptyState({ onClear, hasFilters }) {
  return (
    <section className="civic-hard bg-white p-8 text-center">
      <CircleAlert aria-hidden="true" size={30} className="mx-auto text-civic-ink/40" />
      <h3 className="mt-3 font-display text-xl font-bold">No issues found</h3>
      <p className="mt-1 text-sm text-civic-ink/65">
        {hasFilters ? 'Try a different category, status or search term.' : 'The issue tracker is all clear right now.'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="civic-focus civic-hard-sm mt-4 inline-flex min-h-10 items-center bg-civic-mint px-4 py-2 text-sm font-semibold"
        >
          Clear filters
        </button>
      )}
    </section>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <section className="civic-hard bg-white p-8 text-center">
      <AlertCircleIcon />
      <h3 className="mt-3 font-display text-xl font-bold">Could not load issues</h3>
      <p className="mt-1 text-sm text-civic-ink/60">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="civic-focus civic-hard mt-4 inline-flex min-h-10 items-center gap-2 bg-civic-amber px-4 py-2 font-semibold"
      >
        <RefreshCw size={16} /> Try again
      </button>
    </section>
  );
}

function AlertCircleIcon() {
  return (
    <span className="mx-auto flex h-11 w-11 items-center justify-center border-2 border-civic-ink bg-civic-error-surface text-civic-red">
      <CircleAlert size={22} />
    </span>
  );
}

export default function IssueList() {
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const currentUserId = localStorage.getItem('user_id');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [oldestFirst, setOldestFirst] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);
  const [voteError, setVoteError] = useState('');

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${baseUrl}/api/issues`);
      const records = Array.isArray(response.data?.issues)
        ? response.data.issues
        : Array.isArray(response.data)
        ? response.data
        : [];
      setIssues(records);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const counts = useMemo(
    () =>
      issues.reduce(
        (result, issue) => {
          const normalized = normalizeStatus(issue.status);
          if (normalized === 'open') result.open += 1;
          else if (normalized === 'in progress') result.inProgress += 1;
          else if (normalized === 'closed') result.closed += 1;
          return result;
        },
        { open: 0, inProgress: 0, closed: 0 },
      ),
    [issues],
  );

  const categories = useMemo(
    () => [...new Set(issues.map((issue) => issue.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [issues],
  );

  const filteredIssues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return issues
      .filter((issue) => category === 'all' || issue.category === category)
      .filter((issue) => status === 'all' || normalizeStatus(issue.status) === status)
      .filter(
        (issue) =>
          !normalizedQuery ||
          [issue.issue_title, issue.category, issue.location, issue.description].some((value) =>
            String(value || '').toLowerCase().includes(normalizedQuery),
          ),
      )
      .sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime() || 0;
        const bTime = new Date(b.created_at || 0).getTime() || 0;
        return oldestFirst ? aTime - bTime : bTime - aTime;
      });
  }, [issues, query, category, status, oldestFirst]);

  const hasFilters = Boolean(query || category !== 'all' || status !== 'all');
  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setStatus('all');
    setVisibleCount(6);
  };

  const handleUpvote = async (issueId) => {
    if (!currentUserId) {
      window.alert('You must be logged in to upvote.');
      return;
    }
    const issue = issues.find((item) => String(item.id) === String(issueId));
    if (!issue) return;

    const users = Array.isArray(issue.upvotes?.users) ? issue.upvotes.users.map(String) : [];
    const hasUpvoted = users.includes(String(currentUserId));
    const count = Number.isFinite(Number(issue.upvotes?.count)) ? Number(issue.upvotes.count) : users.length;

    setIssues((current) =>
      current.map((item) =>
        String(item.id) === String(issueId)
          ? {
              ...item,
              upvotes: {
                count: Math.max(0, count + (hasUpvoted ? -1 : 1)),
                users: hasUpvoted
                  ? users.filter((id) => id !== String(currentUserId))
                  : [...users, String(currentUserId)],
              },
            }
          : item,
      ),
    );

    try {
      if (hasUpvoted) {
        await axios.delete(`${baseUrl}/api/issues/${issueId}/upvote`, { data: { user_id: currentUserId } });
      } else {
        await axios.post(`${baseUrl}/api/issues/${issueId}/upvote`, { user_id: currentUserId });
      }
      setVoteError('');
    } catch (err) {
      console.error('Upvote failed:', err);
      setIssues((current) =>
        current.map((item) =>
          String(item.id) === String(issueId)
            ? { ...item, upvotes: { count, users } }
            : item,
        ),
      );
      setVoteError('Failed to update upvote. Please try again.');
    }
  };

  const openIssue = (issueId) => navigate('/issue-detail', { state: { issueId } });
  const renderedIssues = filteredIssues.slice(0, visibleCount);

  return (
    <CivicShell
      title="Issue tracker"
      subtitle="YOUR NEIGHBOURHOOD, BETTER TOGETHER"
      eyebrow="NagarSeva / Public dashboard"
      tagline="CITIZEN PORTAL"
      query={query}
      onQueryChange={(value) => {
        setQuery(value);
        setVisibleCount(6);
      }}
      totalIssues={issues.length}
      openCount={counts.open}
      inProgressCount={counts.inProgress}
      closedCount={counts.closed}
    >
      <div className="page-wrap mx-auto max-w-[1450px] p-8">
        <section className="metric-row mb-7 grid grid-cols-4 gap-4">
          <Metric label="Reported issues" value={issues.length} note="TOTAL REPORTS" />
          <Metric label="Open" value={counts.open} note="NEEDS ATTENTION" tone="green" />
          <Metric label="In progress" value={counts.inProgress} note="BEING ADDRESSED" tone="amber" />
          <Metric label="Closed" value={counts.closed} note="RESOLVED" />
        </section>

        <div className="content-grid grid grid-cols-[minmax(0,1.6fr)_minmax(280px,.8fr)] items-start gap-6">
          <section aria-labelledby="recent-issues-heading" id="issues">
            <div className="feed-heading mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="civic-eyebrow text-civic-ink/50">Neighbourhood reports</p>
                <h2 id="recent-issues-heading" className="mt-1 font-display text-2xl font-bold">
                  Recent issues <span className="font-mono text-sm font-normal text-civic-ink/50">({filteredIssues.length})</span>
                </h2>
              </div>
              <span className="civic-pill bg-civic-ink px-3 py-2 text-white">All issues</span>
            </div>

            <div className="filter-toolbar mb-4 flex flex-wrap items-center justify-between gap-3 border-y-2 border-civic-ink/30 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="civic-eyebrow mr-1 text-civic-ink/50">Filter</span>
                <label className="sr-only" htmlFor="issue-category-filter">Filter by category</label>
                <span className="relative">
                  <select
                    id="issue-category-filter"
                    value={category}
                    onChange={(event) => { setCategory(event.target.value); setVisibleCount(6); }}
                    className="civic-focus civic-pill min-h-10 appearance-none bg-white py-2 pl-3 pr-8"
                  >
                    <option value="all">All categories</option>
                    {categories.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                </span>
                <label className="sr-only" htmlFor="issue-status-filter">Filter by status</label>
                <span className="relative">
                  <select
                    id="issue-status-filter"
                    value={status}
                    onChange={(event) => { setStatus(event.target.value); setVisibleCount(6); }}
                    className="civic-focus civic-pill min-h-10 appearance-none bg-white py-2 pl-3 pr-8"
                  >
                    <option value="all">Any status</option>
                    <option value="open">Open</option>
                    <option value="in progress">In progress</option>
                    <option value="closed">Closed</option>
                  </select>
                  <ChevronDown aria-hidden="true" size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                </span>
                {hasFilters && (
                  <button type="button" onClick={clearFilters} className="civic-focus px-2 py-2 font-mono text-[10px] underline">
                    Clear filters
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOldestFirst((value) => !value)}
                className="civic-focus inline-flex min-h-10 items-center gap-1 font-mono text-[10px] underline underline-offset-2"
              >
                {oldestFirst ? 'Oldest first' : 'Newest first'}
                {oldestFirst ? <ArrowUp aria-hidden="true" size={13} /> : <ArrowDown aria-hidden="true" size={13} />}
              </button>
            </div>

            {voteError && (
              <p role="alert" className="civic-hard-sm mb-4 bg-civic-error-surface px-3 py-2 text-sm font-semibold text-civic-red">
                {voteError}
              </p>
            )}

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }, (_, index) => <IssueSkeleton key={index} />)}
              </div>
            ) : error ? (
              <ErrorState message={error} onRetry={fetchIssues} />
            ) : filteredIssues.length === 0 ? (
              <EmptyState onClear={clearFilters} hasFilters={hasFilters} />
            ) : (
              <>
                {renderedIssues.map((issue, index) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    featured={index === 0}
                    currentUserId={currentUserId}
                    onUpvote={handleUpvote}
                    onOpen={openIssue}
                  />
                ))}
                {filteredIssues.length > visibleCount && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + 6)}
                    className="civic-focus civic-hard mt-2 inline-flex min-h-11 items-center gap-2 bg-civic-ink px-5 py-2.5 text-sm font-bold text-white"
                  >
                    <ArrowDown size={15} aria-hidden="true" /> Load more issues
                  </button>
                )}
              </>
            )}
          </section>

          <WorkflowAside issues={issues} onOpen={openIssue} />
        </div>
      </div>
    </CivicShell>
  );
}
