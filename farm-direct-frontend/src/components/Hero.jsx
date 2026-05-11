import React, { useEffect, useRef, useState } from 'react';

const Hero = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  useEffect(() => {
    const handleMouse = (e) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  const scrollToMarketplace = (e) => {
    e.preventDefault();
    const section = document.getElementById('marketplace');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  const floatingItems = ['🌽', '🍅', '🥦', '🫐', '🍋', '🥕', '🌿', '🍓'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --cream: #F7F2E8;
          --soil: #3D2B1F;
          --leaf: #2D5A27;
          --leaf-light: #4A8C42;
          --sun: #E8A020;
          --sun-light: #F5C842;
          --mist: #E2EDE0;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .hero-root {
          font-family: 'DM Sans', sans-serif;
          width: 100%;
          min-height: 100vh;
          background: var(--cream);
          overflow: hidden;
          position: relative;
        }

        /* ── Animated background mesh ── */
        .hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            radial-gradient(ellipse 80% 60% at 70% 40%, rgba(74,140,66,0.13) 0%, transparent 70%),
            radial-gradient(ellipse 60% 80% at 20% 80%, rgba(232,160,32,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 50% 10%, rgba(45,90,39,0.07) 0%, transparent 60%);
          transition: background 0.3s ease;
        }

        .hero-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D5A27' fill-opacity='0.035'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        /* ── Floating emojis ── */
        .floating-emoji {
          position: absolute;
          font-size: clamp(1.5rem, 2.5vw, 2.2rem);
          opacity: 0;
          animation: floatUp 6s ease-in-out infinite;
          user-select: none;
          pointer-events: none;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.12));
        }

        @keyframes floatUp {
          0%   { opacity: 0; transform: translateY(30px) rotate(-10deg) scale(0.8); }
          15%  { opacity: 0.85; }
          50%  { transform: translateY(-20px) rotate(5deg) scale(1.05); }
          85%  { opacity: 0.85; }
          100% { opacity: 0; transform: translateY(-60px) rotate(-5deg) scale(0.9); }
        }

        /* ── Main layout ── */
        .hero-inner {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 4rem;
        }

        @media (max-width: 768px) {
          .hero-inner {
            grid-template-columns: 1fr;
            padding-top: 5rem;
            padding-bottom: 3rem;
            gap: 2.5rem;
          }
          .hero-visual { order: -1; }
        }

        /* ── Badge ── */
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--leaf);
          color: #fff;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.4rem 0.9rem;
          border-radius: 100px;
          margin-bottom: 1.5rem;
          opacity: 0;
          transform: translateY(12px);
          animation: revealUp 0.6s ease forwards 0.2s;
        }

        .badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--sun-light);
          animation: pulse 2s ease infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.4); opacity: 0.7; }
        }

        /* ── Headline ── */
        .headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.8rem, 5.5vw, 5rem);
          font-weight: 900;
          line-height: 1.05;
          color: var(--soil);
          margin-bottom: 1.2rem;
          opacity: 0;
          transform: translateY(20px);
          animation: revealUp 0.7s ease forwards 0.35s;
        }

        .headline em {
          font-style: italic;
          color: var(--leaf);
          position: relative;
          display: inline-block;
        }

        .headline em::after {
          content: '';
          position: absolute;
          left: 0; bottom: 2px;
          width: 100%; height: 3px;
          background: var(--sun);
          border-radius: 4px;
          transform: scaleX(0);
          transform-origin: left;
          animation: underlineGrow 0.5s ease forwards 1s;
        }

        @keyframes underlineGrow {
          to { transform: scaleX(1); }
        }

        /* ── Subtext ── */
        .subtext {
          font-size: clamp(1rem, 1.5vw, 1.15rem);
          font-weight: 300;
          color: #5A4A3A;
          line-height: 1.75;
          max-width: 440px;
          margin-bottom: 2.5rem;
          opacity: 0;
          transform: translateY(16px);
          animation: revealUp 0.6s ease forwards 0.5s;
        }

        /* ── CTA ── */
        .cta-group {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          flex-wrap: wrap;
          opacity: 0;
          transform: translateY(16px);
          animation: revealUp 0.6s ease forwards 0.65s;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          background: var(--leaf);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 500;
          padding: 0.9rem 2rem;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          box-shadow: 0 4px 20px rgba(45,90,39,0.30);
        }

        .btn-primary:hover {
          background: var(--leaf-light);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(45,90,39,0.35);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .btn-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px; height: 28px;
          background: rgba(255,255,255,0.18);
          border-radius: 50%;
          font-size: 0.85rem;
          transition: transform 0.2s ease;
        }

        .btn-primary:hover .btn-arrow {
          transform: translateX(3px);
        }

        .trust-text {
          font-size: 0.82rem;
          color: #7A6A5A;
          font-weight: 400;
        }

        /* ── Stats row ── */
        .stats-row {
          display: flex;
          gap: 2rem;
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(61,43,31,0.10);
          opacity: 0;
          transform: translateY(16px);
          animation: revealUp 0.6s ease forwards 0.8s;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--soil);
        }

        .stat-label {
          font-size: 0.75rem;
          color: #8A7A6A;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* ── Right visual ── */
        .hero-visual {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          opacity: 0;
          animation: revealScale 0.8s ease forwards 0.4s;
        }

        @keyframes revealScale {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* ── Big circle card ── */
        .visual-card {
          width: clamp(280px, 35vw, 460px);
          height: clamp(280px, 35vw, 460px);
          border-radius: 50%;
          background: linear-gradient(135deg, var(--mist) 0%, #fff 60%, #f0edd6 100%);
          box-shadow:
            0 30px 80px rgba(61,43,31,0.15),
            0 0 0 1px rgba(61,43,31,0.06),
            inset 0 1px 0 rgba(255,255,255,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .visual-card-inner {
          font-size: clamp(5rem, 10vw, 9rem);
          animation: bobble 4s ease-in-out infinite;
          filter: drop-shadow(0 12px 24px rgba(0,0,0,0.15));
          z-index: 1;
        }

        @keyframes bobble {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50%       { transform: translateY(-14px) rotate(3deg); }
        }

        /* Arc text */
        .arc-label {
          position: absolute;
          top: 50%; left: 50%;
          width: 90%; height: 90%;
          transform: translate(-50%, -50%);
        }

        .arc-label text {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          fill: var(--leaf);
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        /* Orbit badge */
        .orbit-badge {
          position: absolute;
          background: #fff;
          border-radius: 16px;
          padding: 0.6rem 1rem;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--soil);
          white-space: nowrap;
          animation: float 3s ease-in-out infinite;
        }

        .orbit-badge-1 {
          top: 8%; right: -8%;
          animation-delay: 0s;
        }

        .orbit-badge-2 {
          bottom: 12%; left: -10%;
          animation-delay: 1.5s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }

        .orbit-icon { font-size: 1.1rem; }

        @keyframes revealUp {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <section className="hero-root" ref={heroRef}>
        {/* Animated background */}
        <div
          className="hero-bg"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at ${mousePos.x * 0.3 + 50}% ${mousePos.y * 0.3 + 25}%, rgba(74,140,66,0.13) 0%, transparent 70%),
              radial-gradient(ellipse 60% 80% at ${100 - mousePos.x * 0.2}% ${100 - mousePos.y * 0.2}%, rgba(232,160,32,0.10) 0%, transparent 60%),
              #F7F2E8
            `,
          }}
        />

        {/* Floating emojis */}
        {floatingItems.map((emoji, i) => (
          <div
            key={i}
            className="floating-emoji"
            style={{
              left: `${10 + i * 11}%`,
              bottom: `-40px`,
              animationDelay: `${i * 0.75}s`,
              animationDuration: `${5 + (i % 3)}s`,
            }}
          >
            {emoji}
          </div>
        ))}

        <div className="hero-inner">
          {/* ── Left: Copy ── */}
          <div className="hero-copy">
            <div className="badge">
              <span className="badge-dot" />
              Farm to Table
            </div>

            <h1 className="headline">
              Fresh Produce,<br />
              <em>Direct</em> from<br />
              Local Farmers
            </h1>

            <p className="subtext">
              Support local agriculture while enjoying the freshest
              organic products delivered to your doorstep.
              No middlemen — better prices, better taste.
            </p>

            <div className="cta-group">
              <a href="#marketplace" className="btn-primary" onClick={scrollToMarketplace}>
                Shop Fresh Produce
                <span className="btn-arrow">→</span>
              </a>
              <span className="trust-text">Free delivery on first order</span>
            </div>

            <div className="stats-row">
              {[
                { num: '240+', label: 'Local Farms' },
                { num: '1.2k', label: 'Products' },
                { num: '98%', label: 'Satisfaction' },
              ].map((s) => (
                <div className="stat" key={s.label}>
                  <span className="stat-num">{s.num}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Visual ── */}
          <div className="hero-visual">
            <div className="visual-card">
              {/* Arc text using SVG */}
              <svg className="arc-label" viewBox="0 0 200 200">
                <defs>
                  <path id="arcPath" d="M 30,100 A 70,70 0 1,1 170,100" />
                </defs>
                <text>
                  <textPath href="#arcPath">
                    SEASONAL • ORGANIC • SUSTAINABLE •
                  </textPath>
                </text>
              </svg>
              <div className="visual-card-inner">🌿</div>
            </div>

            {/* Floating badges */}
            <div className="orbit-badge orbit-badge-1">
              <span className="orbit-icon">🚜</span>
              Harvested Today
            </div>
            <div className="orbit-badge orbit-badge-2">
              <span className="orbit-icon">⭐</span>
              4.9 · 12k Reviews
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;