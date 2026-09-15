import { useEffect, useState } from 'react';
import SpecularButton from './SpecularButton';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'GitHub', href: 'https://github.com/your-username/synccanvas' }
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
      <div className="nav__inner">
        <a href="#top" className="nav__brand" onClick={() => setMenuOpen(false)}>
          <span className="nav__mark" aria-hidden="true" />
          SyncCanvas
        </a>

        <nav className="nav__links" aria-label="Primary">
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="nav__link"
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="nav__cta">
          <SpecularButton
            size="sm"
            radius={999}
            baseColor="#3a3a3a"
            lineColor="#7dd3c0"
            textColor="#f5f5f5"
            shineSize={12}
            shineFade={45}
            proximity={220}
            onClick={() => {
              window.location.href = '#try';
            }}
          >
            Try it live
          </SpecularButton>
        </div>

        <button
          type="button"
          className={`nav__toggle${menuOpen ? ' nav__toggle--open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          <span />
          <span />
        </button>
      </div>

      <div className={`nav__mobile${menuOpen ? ' nav__mobile--open' : ''}`}>
        {NAV_LINKS.map(link => (
          <a
            key={link.label}
            href={link.href}
            className="nav__mobile-link"
            onClick={() => setMenuOpen(false)}
            target={link.href.startsWith('http') ? '_blank' : undefined}
            rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
          >
            {link.label}
          </a>
        ))}
        <SpecularButton
          size="md"
          radius={999}
          baseColor="#3a3a3a"
          lineColor="#7dd3c0"
          textColor="#f5f5f5"
          className="nav__mobile-cta"
          onClick={() => {
            setMenuOpen(false);
            window.location.href = '#try';
          }}
        >
          Try it live
        </SpecularButton>
      </div>
    </header>
  );
};

export default Navbar;