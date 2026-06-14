import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../componenets/BrandLogo';
import '../styles/Layout.css';

export default function PublicLayout({ children }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleMobileNav = () => setMobileNavOpen(prev => !prev);

  return (
    <div className="layout">
      <header className={`header${scrolled ? ' headerScrolled' : ''}`}>
        <div className="headerLeft">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <BrandLogo />
          </Link>
        </div>
        <nav className="headerNav">
          <Link to="/" className="headerLink">Home</Link>
          <Link to="/features" className="headerLink">Features</Link>
          <Link to="/pricing" className="headerLink">Pricing</Link>
          <Link to="/about" className="headerLink">About</Link>
          <Link to="/contact" className="headerLink">Contact</Link>
        </nav>
        <div className="headerRight">
          <Link to="/login" className="headerBtnOutline">Log in</Link>
          <Link to="/register" className="headerBtn">Start Free</Link>
          <button className="hamburger" onClick={toggleMobileNav} aria-label="Toggle navigation">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileNavOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
              )}
            </svg>
          </button>
        </div>
      </header>
      <nav className={`mobileNav${mobileNavOpen ? ' mobileNavOpen' : ''}`}>
        <Link to="/" className="mobileNavLink" onClick={() => setMobileNavOpen(false)}>Home</Link>
        <Link to="/features" className="mobileNavLink" onClick={() => setMobileNavOpen(false)}>Features</Link>
        <Link to="/pricing" className="mobileNavLink" onClick={() => setMobileNavOpen(false)}>Pricing</Link>
        <Link to="/about" className="mobileNavLink" onClick={() => setMobileNavOpen(false)}>About</Link>
        <Link to="/contact" className="mobileNavLink" onClick={() => setMobileNavOpen(false)}>Contact</Link>
        <Link to="/login" className="mobileNavLink" onClick={() => setMobileNavOpen(false)}>Log in</Link>
        <Link to="/register" className="mobileNavLink" onClick={() => setMobileNavOpen(false)}>Start Free</Link>
      </nav>
      <main className="main">{children}</main>
      <footer className="footer">
        <div className="footerInner">
          <div className="footerLeft">
            <BrandLogo />
            <p className="footerDesc">
              NutriPlan Pro helps people plan meals, track nutrition, manage exercise, and build steady health habits with confidence.
            </p>
          </div>
          <div className="footerRight">
            <a href="/terms" className="footerLink">Terms</a>
            <a href="/privacy" className="footerLink">Privacy</a>
            <a href="/contact" className="footerLink">Contact</a>
          </div>
        </div>
        <div className="footerBottom">
          &copy; {new Date().getFullYear()} NutriPlan Pro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
