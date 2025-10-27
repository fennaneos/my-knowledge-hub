// src/pages/index.tsx
import React, { JSX, useEffect, useRef } from "react";
import Layout from "@theme/Layout";
import Head from "@docusaurus/Head";

import GumroadEmbed from "@site/src/components/payments/GumroadEmbed";



// If you actually have this file, keep the import; otherwise comment it out
// import MarketTape from "@site/src/components/market/+";

// Global CSS (plain className="...")
import "../css/custom.css";
import "./index.css"; // defines .heroRoot, .heroOverlay, .heroContent, .heroTitle, .heroTag

// CSS module (use styles.*)
//import styles from "./index.module.css";
import styles from "./tradingHome.module.css";

// Build-time config (no hooks)
import siteConfig from "@generated/docusaurus.config";
const cf = (siteConfig as any).customFields ?? {};
const PRO_LINK = cf.GUMROAD_PRO || "/pricing-labs";
const COURSE_LINK = cf.GUMROAD_COURSE || "#";
const MUG_LINK = cf.GUMROAD_MUG || "#";




/* ---------- Send a Message ---------- */
const FORMSPREE_ID = "mnnonlvz"; // cf.FORMSPREE_ID || "";            // fallback blank to avoid 404
const CONTACT_EMAIL = cf.CONTACT_EMAIL || "yfennaneoussama@gmail.com";

function SendMessageCard() {
  const [state, setState] = React.useState<"idle"|"sending"|"ok"|"err">("idle");
  const [errMsg, setErrMsg] = React.useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrMsg("");
    setState("sending");

    try {
      const form = e.currentTarget;
      const data = new FormData(form);

      if (!FORMSPREE_ID) {
        throw new Error("Form is not configured (missing Formspree ID).");
      }

      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: data,
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setState("ok");
        form.reset();
      } else {
        throw new Error(json?.error || "Unable to send your message. Please try email instead.");
      }
    } catch (err:any) {
      setErrMsg(err?.message || "Something went wrong.");
      setState("err");
    }
  }

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Website message"
  )}`;

  return (
    <div className={`${styles.contactCard} ${styles.blackCard}`}>
      <div className={styles.cardHead}>
        <h3>Send a Message</h3>
        <div className={styles.cardSub}>I’ll reply by email</div>
      </div>

      {state === "ok" ? (
        <div className={styles.successBox}>
          ✅ Thanks! Your message was sent.
        </div>
      ) : (
        <>
          {state === "err" && (
            <div className={styles.errorBox}>
              {errMsg} <a className="link-neo" href={mailto}>Email instead</a>.
            </div>
          )}

          <form className={styles.contactForm} onSubmit={onSubmit}>
            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor="name">Your Name</label>
              <input className={styles.input} id="name" name="name" type="text" autoComplete="off" />
            </div>

            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor="email">Email</label>
              <input className={styles.input} id="email" name="email" type="email" autoComplete="off" required />
            </div>

            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor="message">Message</label>
              <textarea className={styles.textarea} id="message" name="message" rows={6} placeholder="How can I help?"></textarea>
            </div>

<div className={styles.formActions}>
  <button className="btn-dark" type="submit">
    Send Message
  </button>
  <a className="btn-dark-outline" href={`mailto:${CONTACT_EMAIL}`}>
    Email instead
  </a>
</div>


            <div className={styles.smallNote}>
              Submissions are private. You’ll see a success message after sending.
            </div>
          </form>
        </>
      )}
    </div>
  );
}


/* ------------------------------------------------------------------ */
/* TradingView chart                                                   */
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
/* About me                                                            */
/* ------------------------------------------------------------------ */
function AboutMe() {
  return (
    <section className={styles.aboutWrap}>
      {/* Bio row with small photo */}
      <div className={styles.aboutBox}>
        <img
          className={styles.aboutPhoto}
          src="/img/me.png"
          alt="Instructor portrait"
          loading="lazy"
        />
        <div className={styles.aboutText}>
          <h2>About the Instructor</h2>
          <p>
            I’m <strong>Fennane Oussama</strong>, a mathematician and quant developer with a
            double engineer degree in Advanced Computer Science and Quantitative Finance.
          </p>
          <p>
            My teaching is practical and rigorous: clear theory, strong intuition, and hands-on labs
            mirroring real-world models and workflows.
          </p>

          <div className={styles.aboutCTA}>
            <a className="btn-neo-gold" href="/book/intro-call">Book an Intro Call</a>
          </div>

        </div>
      </div>

      {/* Cards go BELOW the bio */}
      <div className={styles.contactGrid}>
        <article className={styles.contactCard}>
          <div className="cardHead"><h3>Book a Course Meeting</h3></div>
          <div className="cardSub">Pick a time that works for you</div>
          <div className={styles.calendarWrap}>
            <iframe
              className={styles.calendarFrame}   // your black box style
              src="https://cal.com/fennaneo/1h-course-meeting?embed=true&theme=dark"
              title="Book a Course Meeting"
              loading="lazy"
              /* Cal needs same-origin to work in iframe */
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              /* Permissions commonly used by Cal */
              allow="camera; microphone; autoplay; payment"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Fallback open-in-new-tab in case something blocks iframes */}
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <a className="btn-wire" href="https://cal.com/fennaneo/1h-course-meeting" target="_blank" rel="noopener noreferrer">
                Open booking in a new tab
              </a>
            </div>
          </div>

        </article>

  <SendMessageCard />

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

      {/* Hero (global CSS classes) */}
      <div className="heroRoot">
        <div className="heroOverlay" />
        <div className="heroContent">
          <h1 className="heroTitle">Markets Dashboard</h1>
          <p className="heroTag">Realtime tickers, a premium dark chart, and a quick equity watchlist.</p>
          <div className="cta-group">
            <a className="btn-neo-blue" href="/">Home</a>
            <a className="btn-ghost-blue" href="/finance/Actions-indices">Finance Courses</a>
            <a className="btn-ghost-blue" href="/premium/volatility-handbook">Premium Courses</a>
            <a className="btn-ghost-blue" href="/lab">Open Lab <span className="badge-new">NEW</span></a>
          </div>
          <div className="cta-group cta-pro-line">
            <a className="btn-neo-red-modern" href="/pricing-labs">Get Pro</a>
          </div>
        </div>
      </div>

      {/* Main (CSS module classes) */}
      <main className={styles.mainWrap}>
        {/* Market Tape */}
        {/* If you don't actually have MarketTape yet, keep this commented: */}
        {/* <section className={styles.box}>
          <div className={styles.boxHeader}><span>Market Tape</span></div>
          <div className={styles.boxBody}>
            <MarketTape />
          </div>
        </section> */}

        {/* Chart */}
        <section className={styles.box}>
          <div className={styles.boxHeader}><span>Equity Chart</span></div>
          <div className={styles.boxBody} style={{ padding: 0 }}>
            <TradingViewChart symbol="NASDAQ:AAPL" />
          </div>
        </section>

        {/* About */}
        <AboutMe />
        <section className={styles.marqueeSection}>
          <div className={styles.marqueeMask}>
            <div className={styles.marqueeTrack}>
              <div className={styles.quoteCard}>
                <p className={styles.quoteText}>
                  “Absolutely love this dashboard. Clean, fast, and visually stunning!”
                </p>
                <div className={styles.quoteMeta}>
                  <span className={styles.quoteName}>— TraderMike</span>
                  <span>Full-time Retail Trader</span>
                </div>
              </div>

              <div className={styles.quoteCard}>
                <p className={styles.quoteText}>
                  “Helped me understand volatility concepts in a practical way.”
                </p>
                <div className={styles.quoteMeta}>
                  <span className={styles.quoteName}>— Sarah Q.</span>
                  <span>Finance Student</span>
                </div>
              </div>

              <div className={styles.quoteCard}>
                <p className={styles.quoteText}>
                  “The courses blend math and markets perfectly. Highly recommend.”
                </p>
                <div className={styles.quoteMeta}>
                  <span className={styles.quoteName}>— Alex F.</span>
                  <span>Quant Researcher</span>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Products grid */}
        <section className="products-grid" style={{ marginTop: 18 }}>
          <article className="card">
            <div className="cardHeader">
              <div>
                <div className="cardKicker">Membership</div>
                <div className="cardTitle">Get Pro Access</div>
              </div>
              <span className="badge-new">New</span>
            </div>
            <img src="/img/shop/pro-access-card.jpg" alt="Pro Access" />
            <div className="btn-row">
              <a className="gumroad-button btn-neo-red-modern" href={PRO_LINK}>Unlock Pro</a>
              <a className="gumroad-button btn-neo-blue" href={COURSE_LINK}>Buy Course</a>
              <a className="gumroad-button btn-neo-blue" href={MUG_LINK}>Buy Mug</a>

            </div>
            <p className="figure-caption">Subscriptions • secure checkout • cancel anytime</p>
          </article>

          <article className="card">
            <div className="cardHeader">
              <div>
                <div className="cardKicker">Course</div>
                <div className="cardTitle">Quant Finance Bootcamp</div>
              </div>
            </div>
            <img src="/img/shop/quant-bootcamp.jpg" alt="Quant Bootcamp" />
            <div className="btn-row">
              <a className="gumroad-button btn-neo-blue" href={COURSE_LINK}>Buy Course</a>
              <a className="btn-wire" href="/premium/volatility-handbook">Syllabus</a>
            </div>
            <p className="figure-caption">Lifetime access • updates included</p>
          </article>

          <article className="card">
            <div className="cardHeader">
              <div>
                <div className="cardKicker">Merch</div>
                <div className="cardTitle">“Buy Low • Sell High” Mug</div>
              </div>
            </div>
            <img src="/img/shop/buy-low-sell-high-mug.jpg" alt="Buy Low Sell High Mug" />
            <div className="btn-row">
              <a className="gumroad-button btn-neo-blue" href={MUG_LINK}>Buy Mug</a>
              <a className="btn-wire" href="/contact">Questions</a>
            </div>
            <p className="figure-caption">Dishwasher safe • 11oz / 15oz</p>
          </article>
        </section>
      </main>
    </Layout>
  );
}
