import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../componenets/BrandLogo';
import '../styles/Layout.css';

export default function PublicLayout({ children }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        </div>
      </header>
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
