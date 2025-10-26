// src/pages/index.tsx
import React, { useEffect, useRef } from "react";
import Layout from "@theme/Layout";
import MarketTape from "@site/src/components/market/MarketTape";
import styles from "./tradingHome.module.css";

/* ------------------------------------------------------------------ */
/* TradingView chart (client-only init inside useEffect)               */
/* ------------------------------------------------------------------ */
function TradingViewChart({
  symbol = "NASDAQ:AAPL",
  theme = "dark",
  autosize = true,
  interval = "D",
  studies = ["MACD@tv-basicstudies", "RSI@tv-basicstudies"],
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const scriptId = "tv-widget-script";
    const ensureScript = () =>
      new Promise<void>((resolve) => {
        if (document.getElementById(scriptId)) return resolve();
        const s = document.createElement("script");
        s.id = scriptId;
        s.src = "https://s3.tradingview.com/tv.js";
        s.async = true;
        s.onload = () => resolve();
        document.body.appendChild(s);
      });

    ensureScript().then(() => {
      // @ts-ignore
      if (!window.TradingView || !containerRef.current) return;
      containerRef.current.innerHTML = "";
      // @ts-ignore
      new window.TradingView.widget({
        symbol,
        interval,
        autosize,
        theme,
        timezone: "Etc/UTC",
        style: "1",
        locale: "en",
        allow_symbol_change: true,
        studies,
        container_id: containerRef.current.id,
        backgroundColor: "#0b0e14",
      });
    });
  }, [symbol, theme, autosize, interval, studies]);

  return <div id="tv_chart_container" ref={containerRef} className={styles.chartCard} />;
}

/* ------------------------------------------------------------------ */
/* Courses (golden boxed cards)                                        */
/* ------------------------------------------------------------------ */
const COURSES = [
  {
    id: "algebra-calculus",
    title: "Algebra & Calculus",
    level: "Beginner → Advanced",
    desc: "From foundations to multivariable calculus: limits, derivations, integrals, series.",
  },
  {
    id: "prob-stats",
    title: "Probability & Statistics",
    level: "All Levels",
    desc: "Random variables, distributions, estimation, hypothesis testing, time series.",
  },
  {
    id: "quant-finance",
    title: "Quantitative Finance",
    level: "Intermediate → Pro",
    desc: "Stochastic calculus, options, risk, volatility modeling, and Python pricing labs.",
  },
];

function CoursesBox() {
  return (
    <section className={styles.goldSection}>
      <div className={styles.goldFrame}>
        <div className={styles.goldHeader}>
          <h2>Courses</h2>
          <p>Structured live programs with practice, projects and mentorship.</p>
        </div>

        <div className={styles.cardRow}>
          {COURSES.map((c, i) => (
            <article key={c.id} className={`${styles.tarotCard} ${styles[`card${i % 3}`]}`}>
              <header className={styles.tarotHead}>
                <h3>{c.title}</h3>
                <span className={styles.badge}>{c.level}</span>
              </header>
              <p className={styles.tarotDesc}>{c.desc}</p>
              <div className={styles.btnRow}>
                <a className="btn-ghost-gold" href={`/courses/${c.id}`}>Description</a>
                <a className="btn-neo-gold" href={`/book/${c.id}`}>Book</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* About me (photo + journey)                                          */
/* ------------------------------------------------------------------ */
function AboutMe() {
  return (
    <section className={styles.aboutWrap}>
      <div className={styles.aboutBox}>
        <img
          className={styles.aboutPhoto}
          src="/img/me.png" /* place your image in /static/img/me.jpg */
          alt="Instructor portrait"
          loading="lazy"
        />
        <div className={styles.aboutText}>
          <h2>About the Instructor</h2>
          <p>
            I’m <strong>Fennane Oussama</strong>, a mathematician and quant developer 
            with a double engineer degree in Advanced Quantitative Methods and Master in Finance,
            specializing in Quantitative Finance. Over the past decade
            I’ve worked across quantitative finance research, trading, and education—building pricing libraries, training teams,
            and mentoring students from first principles to professional practice.
          </p>
          <p>
            My teaching is practical and rigorous: clear theory, strong intuition, and hands-on labs
            mirroring real-world models and workflows.
          </p>
          <div className={styles.aboutCTA}>
            <a className="btn-neo-gold" href="/book/intro-call">Book an Intro Call</a>
            <a className="btn-ghost-gold" href="/contact">Contact</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Sliding testimonials                                                 */
/* ------------------------------------------------------------------ */
const TESTIMONIALS = [
  { id: 1, name: "Amal", text: "Crystal clear explanations—finally understood Greeks.", role: "MSc Finance" },
  { id: 2, name: "Leo", text: "The projects felt like real quant work. Loved it.", role: "Junior Quant" },
  { id: 3, name: "Sofia", text: "Clean theory, strong intuition, and great feedback.", role: "Data Scientist" },
  { id: 4, name: "Ravi", text: "The BS labs + Python templates were game-changers.", role: "Trader" },
  { id: 5, name: "Nina", text: "Best stats course I’ve taken—period.", role: "Engineer" },
];

function TestimonialsMarquee() {
  return (
    <section className={styles.marqueeSection} aria-label="Student Testimonials">
      <div className={styles.marqueeMask}>
        <ul className={styles.marqueeTrack}>
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <li key={`${t.id}-${i}`} className={styles.quoteCard}>
              <p className={styles.quoteText}>“{t.text}”</p>
              <div className={styles.quoteMeta}>
                <span className={styles.quoteName}>{t.name}</span>
                <span className={styles.quoteRole}>{t.role}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function TradingHome(): JSX.Element {
  return (
    <Layout title="Trading View" description="Live market look, courses, and equity dashboard">
      {/* Hero */}
      <div className={styles.heroRoot}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Markets Dashboard</h1>
          <p className={styles.heroTag}>
            Realtime tickers, a premium dark chart, and a quick equity watchlist.
          </p>
          <div className="cta-group">
            <a className="btn-neo-blue" href="/">Home</a>
            <a className="btn-ghost-blue" href="/finance/Actions-indices">Finance Courses</a>
            <a className="btn-ghost-blue" href="/premium/volatility-handbook">Premium Courses</a>
            <a className="btn-ghost-blue" href="/lab">
              Open Lab <span className="badge-new">NEW</span>
            </a>
          </div>

          <div className="cta-group cta-pro-line">
            <a className="btn-neo-red-modern" href="/pricing-labs">Get Pro</a>
          </div>
        </div>
      </div>


      {/* Existing Market sections */}
      <main className={styles.mainWrap}>
        {/* Market Tape */}
        <section className={styles.box}>
          <div className={styles.boxHeader}><span>Market Tape</span></div>
          <div className={styles.boxBody}>
            <MarketTape />
          </div>
        </section>

        {/* Chart + Watchlist */}
        <section className={styles.grid2}>
          <div className={styles.box}>
            <div className={styles.boxHeader}><span>Equity Chart</span></div>
            <div className={styles.boxBody} style={{ padding: 0 }}>
              <TradingViewChart symbol="NASDAQ:AAPL" />
            </div>
          </div>

          <div className={styles.box}>
            <div className={styles.boxHeader}><span>Watchlist</span></div>
            <div className={styles.boxBody}>
              <ul className={styles.watchlist}>
                {[
                  { sym: "NASDAQ:AAPL", name: "Apple" },
                  { sym: "NASDAQ:MSFT", name: "Microsoft" },
                  { sym: "NASDAQ:NVDA", name: "NVIDIA" },
                  { sym: "NASDAQ:GOOGL", name: "Alphabet" },
                  { sym: "NYSE:BRK.B", name: "Berkshire B" },
                  { sym: "NYSE:JPM", name: "JPMorgan" },
                ].map((s) => (
                  <li key={s.sym} className={styles.watchRow}>
                    <span className={styles.sym}>{s.sym}</span>
                    <span className={styles.nm}>{s.name}</span>
                    <a
                      className={styles.badge}
                      href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(s.sym)}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Open in TradingView"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
              <div className={styles.disclaimer}>
                Data by TradingView widget (free). For production-grade data, see options below.
              </div>
            </div>
          </div>
        </section>

              {/* New Sections */}
      <CoursesBox />
      <AboutMe />
      <TestimonialsMarquee />
      </main>
    </Layout>
  );
}
