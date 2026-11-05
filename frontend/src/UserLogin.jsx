import { useState } from 'react';
import axios from 'axios';
import { AlertCircle, Lock, LogIn, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { CivicPublicFooter } from './CivicShell';

export default function UserLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/api/users/login`, { username, password });
      if (!response.data?.token) throw new Error('Login failed: no token received.');
      localStorage.setItem('user', response.data.token);
      if (response.data.user?.id != null) localStorage.setItem('user_id', response.data.user.id);
      if (response.data.user?.username) localStorage.setItem('username', response.data.user.username);
      onLoginSuccess && onLoginSuccess(response.data.token);
      setUsername('');
      setPassword('');
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-civic-mint text-civic-ink">
      <Navbar activeRoute="/login" />
      <main className="auth-grid grid flex-1 grid-cols-[1.02fr_.98fr]">
        <section className="auth-intro relative flex flex-col justify-between overflow-hidden border-r-[3px] border-civic-ink px-12 py-12 lg:px-16">
          <div className="relative max-w-[590px]">
            <span className="civic-pill inline-flex items-center gap-2 bg-white px-3 py-2">
              <span className="h-2.5 w-2.5 border border-civic-ink bg-civic-green" />
              Public service · Jharkhand
            </span>
            <p className="mt-12 font-mono text-[11px] tracking-[.18em] text-civic-ink/65">YOUR CITY. YOUR VOICE.</p>
            <h1 className="mt-4 font-display text-[clamp(3rem,5vw,5rem)] font-extrabold leading-[.91]">
              A better
              <br />
              neighbourhood
              <br />
              <span className="text-civic-green">starts here.</span>
            </h1>
            <p className="mt-7 max-w-[500px] text-lg leading-relaxed">
              Welcome back. Sign in to report a local issue, follow its progress, and help your community move forward.
            </p>
          </div>
          <div className="relative mt-12">
            <p className="civic-eyebrow mb-3 text-civic-ink/60">Community at a glance</p>
            <div className="grid max-w-[520px] grid-cols-2 gap-3">
              <div className="civic-hard-strong bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] tracking-[.1em] text-civic-ink/60">REPORT AN ISSUE</span>
                  <ShieldCheck size={20} className="text-civic-green" aria-hidden="true" />
                </div>
                <p className="mt-3 font-display text-2xl font-extrabold">Share details</p>
                <p className="mt-1 text-xs text-civic-ink/65">Photo, location, description</p>
              </div>
              <div className="civic-hard-strong bg-civic-green p-4 text-white sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] tracking-[.1em]">FOLLOW UPDATES</span>
                  <ShieldCheck size={20} aria-hidden="true" />
                </div>
                <p className="mt-3 font-display text-2xl font-extrabold">Track progress</p>
                <p className="mt-1 text-xs text-white/80">Return to your community feed</p>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-form-surface paper-grid flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
          <div className="civic-hard-strong w-full max-w-[530px] bg-white p-6 sm:p-10 lg:p-11">
            <div className="mb-8 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] tracking-[.16em] text-civic-ink/60">CITIZEN ACCESS / 01</span>
              <span className="civic-pill inline-flex items-center gap-2 bg-civic-mint px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-civic-green" />
                Account sign in
              </span>
            </div>
            <h2 className="font-display text-4xl font-extrabold leading-none sm:text-5xl">User Login</h2>
            <p className="mt-3 text-[15px] text-civic-ink/70">Good to see you again. Enter your account details.</p>
            <form aria-label="User login form" onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="username" className="mb-2 block font-display text-sm font-bold">
                  Username
                </label>
                <div className="relative">
                  <UserRound aria-hidden="true" size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-civic-ink/55" />
                  <input
                    autoComplete="username"
                    type="text"
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                    placeholder="Enter your username"
                    disabled={loading}
                    className="civic-focus min-h-[54px] w-full border-2 border-civic-ink bg-white pl-12 pr-4 text-[15px] placeholder:text-civic-ink/40"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block font-display text-sm font-bold">
                  Password
                </label>
                <div className="relative">
                  <Lock aria-hidden="true" size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-civic-ink/55" />
                  <input
                    autoComplete="current-password"
                    type="password"
                    id="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="Enter your password"
                    disabled={loading}
                    className="civic-focus min-h-[54px] w-full border-2 border-civic-ink bg-white pl-12 pr-4 text-[15px] placeholder:text-civic-ink/40"
                  />
                </div>
              </div>
              {error && (
                <div role="alert" className="flex items-start gap-2.5 border-2 border-civic-red bg-civic-error-surface px-3 py-2.5 text-[#792323]">
                  <AlertCircle size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-display text-sm font-bold">We couldn't sign you in</p>
                    <p className="mt-0.5 text-xs">{error}</p>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="civic-focus civic-hard-strong flex min-h-[56px] w-full items-center justify-center gap-3 bg-civic-green font-display text-lg font-bold text-white hover:bg-[#267738] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn aria-hidden="true" size={20} />
                {loading ? 'Logging in…' : 'Log In'}
              </button>
            </form>
            <div className="mt-7 border-t-2 border-civic-ink/20 pt-6 text-center">
              <p className="text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="civic-focus font-display font-bold text-civic-green underline decoration-2 underline-offset-4">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <CivicPublicFooter />
    </div>
  );
}
