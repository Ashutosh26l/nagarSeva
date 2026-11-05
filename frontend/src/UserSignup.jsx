import { useState } from 'react';
import axios from 'axios';
import { AlertCircle, ArrowRight, Check, Lock, ShieldCheck, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import { CivicPublicFooter } from './CivicShell';

export default function UserSignup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setSuccess('');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/api/users/signup`, { username, password });
      if (response.data?.message === 'User created') {
        setSuccess(`User ${response.data.user?.username || username} created successfully.`);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError('Signup failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error signing up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-civic-mint text-civic-ink">
      <Navbar activeRoute="/signup" />
      <main className="signup-grid mx-auto grid w-full max-w-[1120px] flex-1 grid-cols-[.92fr_1.08fr] items-center gap-8 px-5 py-8 md:gap-12 md:px-8 md:py-12">
        <section className="mx-auto max-w-md md:mx-0">
          <span className="civic-pill inline-flex items-center gap-2 bg-white px-3 py-2">
            <ShieldCheck aria-hidden="true" size={16} className="text-civic-green" />
            One account. Your city.
          </span>
          <h1 className="mt-6 font-display text-4xl font-black leading-[1.02] sm:text-5xl">
            Make your
            <br />
            <span className="text-civic-green">voice count.</span>
          </h1>
          <p className="mt-5 max-w-[420px] text-lg leading-relaxed">
            Create an account to report local issues, follow their progress, and help make your community better.
          </p>
          <div className="mt-8 border-l-[5px] border-civic-green py-1 pl-4">
            <p className="civic-eyebrow text-civic-ink/60">How NagarSeva works</p>
            <div className="mt-3 flex items-start gap-3">
              <span className="civic-hard flex h-8 w-8 shrink-0 items-center justify-center bg-civic-green font-display font-bold text-white">01</span>
              <div>
                <p className="font-display font-bold">Report an issue</p>
                <p className="text-sm text-civic-ink/75">Share a photo and location.</p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-3">
              <span className="civic-hard flex h-8 w-8 shrink-0 items-center justify-center bg-civic-amber font-display font-bold">02</span>
              <div>
                <p className="font-display font-bold">Track the response</p>
                <p className="text-sm text-civic-ink/75">See updates from your community.</p>
              </div>
            </div>
          </div>
          <p className="mt-8 flex items-center gap-2 font-mono text-[10px] text-civic-ink/65">
            <ShieldCheck size={16} className="text-civic-green" aria-hidden="true" />
            Built for citizens across Jharkhand
          </p>
        </section>

        <section className="mx-auto w-full max-w-[520px]">
          <div className="civic-hard-strong relative bg-white p-6 sm:p-9">
            <span className="absolute -top-3 left-5 border-2 border-civic-ink bg-civic-amber px-3 py-1 font-mono text-[10px] font-bold tracking-wider">
              NEW CITIZEN ACCOUNT
            </span>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <p className="civic-eyebrow text-civic-ink/55">Get started</p>
                <h2 className="mt-1 font-display text-3xl font-black sm:text-4xl">Create account</h2>
              </div>
              <span className="hidden h-12 w-12 items-center justify-center border-2 border-civic-ink bg-civic-mint text-civic-green sm:flex">
                <UserPlus size={24} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-sm text-civic-ink/70">Enter your details to join your local issue tracker.</p>

            <form aria-label="Create NagarSeva account" onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="signup-username" className="mb-2 block font-display text-sm font-bold">
                  Username
                </label>
                <input
                  autoComplete="username"
                  id="signup-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  placeholder="Choose a username"
                  disabled={loading}
                  className="civic-focus min-h-12 w-full border-2 border-civic-ink bg-white px-4 placeholder:text-civic-ink/45"
                />
                <p className="mt-2 font-mono text-[10px] text-civic-ink/55">YOUR NAME IN THE COMMUNITY</p>
              </div>
              <div>
                <label htmlFor="signup-password" className="mb-2 block font-display text-sm font-bold">
                  Password
                </label>
                <div className="relative">
                  <input
                    autoComplete="new-password"
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="Create a password"
                    disabled={loading}
                    className="civic-focus min-h-12 w-full border-2 border-civic-ink bg-white px-4 pr-12 placeholder:text-civic-ink/45"
                  />
                  <Lock aria-hidden="true" size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-civic-ink/55" />
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="mb-2 block font-display text-sm font-bold">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    autoComplete="new-password"
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    aria-invalid={error === 'Passwords do not match'}
                    placeholder="Confirm your password"
                    disabled={loading}
                    className={`civic-focus min-h-12 w-full border-2 bg-white px-4 pr-12 placeholder:text-civic-ink/45 ${
                      error === 'Passwords do not match' ? 'border-civic-red bg-[#FFF9F7]' : 'border-civic-ink'
                    }`}
                  />
                  <Lock aria-hidden="true" size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-civic-ink/55" />
                </div>
              </div>

              {error && (
                <p role="alert" className="flex items-center gap-2 border-2 border-civic-red bg-civic-error-surface px-3 py-2 text-sm font-semibold text-[#792323]">
                  <AlertCircle size={17} aria-hidden="true" />
                  {error}
                </p>
              )}
              {success && (
                <div role="status" className="flex items-start gap-3 border-2 border-civic-green bg-[#E4F1E6] px-4 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-civic-ink bg-civic-green text-white">
                    <Check size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold">Account created</p>
                    <p className="text-sm text-[#23482B]">{success}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="civic-focus civic-hard-strong flex min-h-12 w-full items-center justify-center bg-civic-green px-5 py-3 font-display font-bold tracking-wide text-white hover:bg-[#267637] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Creating account…' : 'Sign Up'}
                <ArrowRight aria-hidden="true" size={18} className="ml-2" />
              </button>
            </form>

            <div className="mt-6 border-t-2 border-dashed border-civic-ink/30 pt-5 text-center">
              <p className="text-sm text-civic-ink/70">Already have an account?</p>
              <Link to="/login" className="civic-focus mt-1 inline-flex min-h-11 items-center justify-center px-2 font-bold text-[#267637] underline underline-offset-4">
                Back to login <ArrowRight aria-hidden="true" size={15} className="ml-1 -rotate-45" />
              </Link>
            </div>
          </div>
          <div className="mt-5 flex justify-between px-1 font-mono text-[9px] tracking-wider text-civic-ink/55">
            <span>FORM · CITIZEN REGISTRATION</span>
            <span>01 / 01</span>
          </div>
        </section>
      </main>
      <CivicPublicFooter />
    </div>
  );
}
