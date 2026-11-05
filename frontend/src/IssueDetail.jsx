import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Send,
  ThumbsUp,
  TriangleAlert,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CivicShell from './CivicShell';

const normalizeStatus = (status) => String(status || 'unknown').trim().toLowerCase();

const statusClass = (status) => {
  const value = normalizeStatus(status);
  if (value === 'open') return 'bg-civic-green text-white';
  if (value === 'in progress') return 'bg-civic-amber text-civic-ink';
  if (value === 'closed') return 'bg-civic-ink text-white';
  return 'bg-white text-civic-ink';
};

const formatDate = (value, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat(undefined, options).format(date);
};

function StatePanel({ error, loading = false }) {
  return (
    <div className="grid min-h-[55vh] place-items-center p-6">
      <section
        role={error ? 'alert' : 'status'}
        className={`civic-hard-strong w-full max-w-2xl p-8 text-center ${error ? 'bg-civic-error-surface' : 'bg-white'}`}
      >
        {error ? (
          <TriangleAlert size={34} className="mx-auto text-civic-red" aria-hidden="true" />
        ) : (
          <LoaderCircle size={34} className="mx-auto animate-spin text-civic-green" aria-hidden="true" />
        )}
        <h2 className="mt-4 font-display text-2xl font-bold">
          {error ? 'Couldn’t load this report' : 'Loading issue details…'}
        </h2>
        {error && <p className="mt-2 text-civic-ink/70">{error}</p>}
        {error && (
          <Link
            to="/issuelist"
            className="civic-focus civic-hard mt-5 inline-flex min-h-11 items-center gap-2 bg-white px-4 font-bold"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Go to Issues
          </Link>
        )}
        {loading && <p className="mt-2 font-mono text-xs text-civic-ink/55">FETCHING THE LATEST REPORT</p>}
      </section>
    </div>
  );
}

export default function IssueDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const issueId = location.state?.issueId;
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const currentUserId = localStorage.getItem('user_id');

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isCommentsVisible, setIsCommentsVisible] = useState(true);
  const [mainImage, setMainImage] = useState('');
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!issueId) {
      setLoading(false);
      setError('No issue selected. Please return to the issue list.');
      return () => {
        active = false;
      };
    }
    const fetchIssueData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${baseUrl}/api/issues/${issueId}`);
        if (!active) return;
        const fetchedIssue = response.data?.issue;
        if (!fetchedIssue) throw new Error('Issue details were not found.');
        setIssue(fetchedIssue);
        setUpvoteCount(Number(fetchedIssue.upvotes?.count) || 0);
        setHasUpvoted(
          Boolean(currentUserId && fetchedIssue.upvotes?.users?.map(String).includes(String(currentUserId))),
        );
        setMainImage(fetchedIssue.images?.[0] || '');
        setComments(Array.isArray(fetchedIssue.comments) ? fetchedIssue.comments : []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || err.message || 'Failed to fetch issue data.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchIssueData();
    return () => {
      active = false;
    };
  }, [issueId, baseUrl, currentUserId]);

  const handleUpvoteClick = async () => {
    if (!currentUserId) {
      window.alert('Please log in to upvote.');
      navigate('/login');
      return;
    }
    if (!issue) return;
    const previousVoted = hasUpvoted;
    const previousCount = upvoteCount;
    setHasUpvoted(!previousVoted);
    setUpvoteCount(Math.max(0, previousCount + (previousVoted ? -1 : 1)));
    try {
      const url = `${baseUrl}/api/issues/${issue.id}/upvote`;
      const payload = { user_id: currentUserId };
      const response = previousVoted
        ? await axios.delete(url, { data: payload })
        : await axios.post(url, payload);
      if (typeof response.data?.count === 'number') setUpvoteCount(response.data.count);
    } catch (err) {
      console.error('Upvote failed:', err);
      setHasUpvoted(previousVoted);
      setUpvoteCount(previousCount);
      window.alert('Something went wrong with your upvote. Please try again.');
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!newComment.trim()) return;
    if (!currentUserId) {
      window.alert('You must be logged in to comment.');
      navigate('/login');
      return;
    }
    const commentText = newComment.trim();
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      user_id: currentUserId,
      comment: commentText,
      created_at: new Date().toISOString(),
    };
    const previousComments = comments;
    setComments((current) => [...current, optimisticComment]);
    setNewComment('');
    setCommentError('');
    setCommentSubmitting(true);
    try {
      await axios.post(`${baseUrl}/api/issues/${issueId}/comments`, {
        user_id: currentUserId,
        comment: commentText,
      });
    } catch (err) {
      console.error('Failed to post comment:', err);
      setComments(previousComments);
      setNewComment(commentText);
      setCommentError('Failed to post comment. Please try again.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (loading)
    return (
      <CivicShell title="Issue details" eyebrow="NagarSeva / Community report">
        <StatePanel loading />
      </CivicShell>
    );

  if (error || !issue)
    return (
      <CivicShell title="Issue details" eyebrow="NagarSeva / Community report">
        <StatePanel error={error || 'Issue details are unavailable.'} />
      </CivicShell>
    );

  const images = Array.isArray(issue.images) ? issue.images : [];
  const statusLabel = normalizeStatus(issue.status).replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <CivicShell
      title={issue.issue_title || 'Issue details'}
      subtitle="COMMUNITY REPORT · DETAILS AND UPDATES"
      eyebrow="NagarSeva / Issue tracker"
      tagline="CITIZEN ISSUE TRACKER"
    >
      <div className="detail-wrap paper-grid min-h-[calc(100dvh-80px)] p-5 md:p-7">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Link to="/issuelist" className="civic-focus inline-flex min-h-10 items-center gap-2 font-semibold">
              <span className="civic-hard flex h-9 w-9 items-center justify-center bg-white">
                <ArrowLeft size={18} aria-hidden="true" />
              </span>
              Back to Issues
            </Link>
            <span className="civic-eyebrow text-civic-ink/55">Issue detail / #{String(issue.id).slice(0, 8)}</span>
          </div>

          <div className="detail-grid grid grid-cols-[minmax(0,1fr)_310px] items-start gap-6">
            <article className="civic-hard-strong min-w-0 bg-white p-6 md:p-8">
              <header className="border-b-[3px] border-civic-ink pb-6">
                <div className="meta-row mb-5 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="civic-pill max-w-full truncate bg-civic-mint px-3 py-1.5">
                      {issue.category || 'Community report'}
                    </span>
                    <span className={`civic-pill inline-flex items-center gap-2 px-3 py-1.5 ${statusClass(issue.status)}`}>
                      <span className="h-2 w-2 border border-current bg-current" />
                      {statusLabel}
                    </span>
                  </div>
                  <span className="flex items-center gap-2 font-mono text-[10px] text-civic-ink/60">
                    <CalendarDays size={15} aria-hidden="true" />
                    REPORTED {formatDate(issue.created_at).toUpperCase()}
                  </span>
                </div>
                <h2 className="hero-title max-w-4xl break-words font-display text-[48px] font-extrabold leading-[1.03]">
                  {issue.issue_title || 'Untitled issue'}
                </h2>
                <p className="mt-4 flex items-center gap-2 font-mono text-xs text-civic-ink/70">
                  <MapPin size={17} className="shrink-0 text-civic-green" aria-hidden="true" />
                  {issue.location || 'Location not provided'}
                </p>
              </header>

              <section className="py-6">
                <p className="civic-eyebrow mb-2 text-civic-ink/50">What’s happening</p>
                <p className="max-w-4xl whitespace-pre-wrap text-[17px] leading-7">
                  {issue.description || 'No description was provided for this report.'}
                </p>
              </section>

              {images.length > 0 && (
                <section className="border-t-2 border-dashed border-civic-ink/35 pt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-display text-xl font-bold">Photos from the site</h3>
                    <span className="font-mono text-[10px] text-civic-ink/55">
                      {images.length} ATTACHMENT{images.length === 1 ? '' : 'S'}
                    </span>
                  </div>
                  {mainImage && (
                    <div className="civic-hard relative overflow-hidden bg-civic-mint">
                      <img
                        src={mainImage}
                        alt={`${issue.issue_title || 'Issue'} photo`}
                        className="gallery-main h-[390px] w-full object-contain"
                      />
                      <span className="absolute bottom-3 left-3 border-2 border-civic-ink bg-white px-3 py-1.5 font-mono text-[10px]">
                        PHOTO {String(images.indexOf(mainImage) + 1).padStart(2, '0')} /{' '}
                        {String(images.length).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  {images.length > 1 && (
                    <div className="gallery-thumbs mt-3 grid grid-cols-3 gap-3">
                      {images.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          aria-label={`Show issue photo ${index + 1}`}
                          aria-pressed={image === mainImage}
                          onClick={() => setMainImage(image)}
                          className={`civic-focus civic-hard-sm relative h-[100px] overflow-hidden bg-white ${
                            image === mainImage ? 'outline outline-2 outline-civic-amber' : ''
                          }`}
                        >
                          <img src={image} alt={`Issue photo ${index + 1}`} className="h-full w-full object-cover" />
                          <span className="absolute bottom-1 left-1 border border-civic-ink bg-civic-amber px-1.5 font-mono text-[9px]">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

              <section className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t-[3px] border-civic-ink pt-5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleUpvoteClick}
                    aria-pressed={hasUpvoted}
                    className={`civic-focus civic-hard inline-flex min-h-12 items-center gap-2 px-5 font-bold text-white ${
                      hasUpvoted ? 'bg-civic-ink' : 'bg-civic-green'
                    }`}
                  >
                    <ThumbsUp size={18} aria-hidden="true" />
                    {hasUpvoted ? 'Supported' : 'Upvote'}
                  </button>
                  <div>
                    <p className="font-display text-2xl font-extrabold">{upvoteCount}</p>
                    <p className="font-mono text-[9px] tracking-wider text-civic-ink/55">PEOPLE SUPPORT THIS</p>
                  </div>
                </div>
                <span className="text-xs text-civic-ink/60">
                  {hasUpvoted ? 'You support this report.' : 'Add your support to this report.'}
                </span>
              </section>

              <section className="mt-7 border-t-2 border-dashed border-civic-ink/35 pt-6">
                <div className="comment-head mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="civic-eyebrow text-civic-ink/55">Neighbourhood updates</p>
                    <h3 className="mt-1 font-display text-2xl font-extrabold">
                      Comments{' '}
                      <span className="font-mono text-base font-normal text-civic-ink/55">({comments.length})</span>
                    </h3>
                  </div>
                  <button
                    type="button"
                    aria-expanded={isCommentsVisible}
                    onClick={() => setIsCommentsVisible((visible) => !visible)}
                    className="civic-focus civic-hard inline-flex min-h-10 items-center gap-2 bg-white px-3 text-sm font-semibold"
                  >
                    <MessageCircle size={16} aria-hidden="true" />
                    {isCommentsVisible ? 'Hide comments' : 'Show comments'}
                  </button>
                </div>

                {isCommentsVisible && (
                  <>
                    <div className="space-y-3">
                      {comments.length ? (
                        comments.map((comment) => (
                          <article key={comment.id} className="flex gap-3">
                            <span
                              aria-hidden="true"
                              className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-civic-ink bg-civic-amber font-bold"
                            >
                              {comment.user_id?.charAt(0).toUpperCase() || 'U'}
                            </span>
                            <div className="min-w-0 flex-1 border-2 border-civic-ink bg-[#F8FBF8] p-4">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <strong className="font-display">
                                  Resident {comment.user_id ? comment.user_id.substring(0, 8) : 'Unknown'}
                                </strong>
                                <time className="font-mono text-[9px] text-civic-ink/50">
                                  {formatDate(comment.created_at, {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  }).toUpperCase()}
                                </time>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{comment.comment}</p>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className="border-2 border-dashed border-civic-ink/30 p-5 text-center text-sm text-civic-ink/60">
                          Be the first to comment.
                        </p>
                      )}
                    </div>

                    <form onSubmit={handleCommentSubmit} className="mt-5 border-2 border-civic-ink bg-civic-mint p-4">
                      <label htmlFor="issue-comment" className="civic-eyebrow mb-2 block">
                        Add a comment
                      </label>
                      <textarea
                        id="issue-comment"
                        value={newComment}
                        onChange={(event) => setNewComment(event.target.value)}
                        placeholder="Join the conversation…"
                        rows={4}
                        className="civic-focus min-h-24 w-full resize-y border-2 border-civic-ink bg-white p-3 text-sm outline-none placeholder:text-civic-ink/40"
                      />
                      {commentError && (
                        <p role="alert" className="mt-2 text-sm font-semibold text-civic-red">
                          {commentError}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <span className="font-mono text-[9px] text-civic-ink/50">KEEP IT HELPFUL AND RESPECTFUL</span>
                        <button
                          type="submit"
                          disabled={!newComment.trim() || commentSubmitting}
                          className="civic-focus civic-hard inline-flex min-h-11 items-center gap-2 bg-civic-ink px-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {commentSubmitting ? 'Posting…' : 'Post Comment'} <Send size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </section>
            </article>

            <aside className="right-rail space-y-5">
              <section className="civic-hard bg-white p-5">
                <p className="civic-eyebrow text-civic-ink/50">Report snapshot</p>
                <dl className="mt-4">
                  <div className="flex items-center justify-between gap-3 border-b border-civic-ink/20 py-3">
                    <dt className="text-sm">Status</dt>
                    <dd className={`civic-pill px-2 py-1 ${statusClass(issue.status)}`}>{statusLabel}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-civic-ink/20 py-3">
                    <dt className="text-sm">Category</dt>
                    <dd className="max-w-[60%] break-words text-right font-semibold">{issue.category || 'Uncategorized'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-civic-ink/20 py-3">
                    <dt className="text-sm">Reported</dt>
                    <dd className="text-right font-mono text-[10px]">{formatDate(issue.created_at).toUpperCase()}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-3">
                    <dt className="text-sm">Issue ID</dt>
                    <dd className="break-all text-right font-mono text-[10px]">#{String(issue.id).slice(0, 12)}</dd>
                  </div>
                </dl>
              </section>

              <section className="civic-hard overflow-hidden bg-civic-ink text-white">
                <div className="border-b-2 border-white/20 px-5 py-4">
                  <p className="font-mono text-[10px] tracking-[.15em] text-white/55">REPORTED LOCATION</p>
                  <h3 className="mt-1 font-display text-lg font-bold">Location details</h3>
                </div>
                <div className="flex min-h-32 items-center justify-center bg-civic-mint px-5 py-6 text-center text-civic-ink">
                  <MapPin size={24} className="mr-2 shrink-0 text-civic-green" aria-hidden="true" />
                  <p className="break-words text-sm">{issue.location || 'No location provided'}</p>
                </div>
                <p className="p-4 text-xs text-white/75">
                  Location is based on the details included with this report.
                </p>
              </section>

              <section className="civic-hard bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-civic-ink bg-civic-amber">
                    <MessageCircle size={19} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display font-bold">Community discussion</h3>
                    <p className="mt-1 text-xs leading-5 text-civic-ink/65">
                      {comments.length} comment{comments.length === 1 ? '' : 's'} on this report.
                    </p>
                  </div>
                </div>
                <div className="mt-3 border-t border-civic-ink/20 pt-3 font-mono text-[9px] text-civic-ink/50">
                  REPORTED · {formatDate(issue.created_at).toUpperCase()}
                </div>
              </section>

              <Link
                to="/issuelist"
                className="civic-focus civic-hard flex min-h-11 items-center justify-center gap-2 bg-civic-amber px-4 font-bold"
              >
                Back to issue list <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </CivicShell>
  );
}
