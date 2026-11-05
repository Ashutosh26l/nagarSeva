import { CivicPublicHeader } from './CivicShell';

export default function Navbar({ activeRoute = '' }) {
  return <CivicPublicHeader activeRoute={activeRoute} />;
}
