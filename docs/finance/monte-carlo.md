---
id: monte-carlo
title: Monte Carlo π Lab
sidebar_label: Monte Carlo π
---

import ChapterStars from '@site/src/components/progress/ChapterStars';
import ClearStarsButton from '@site/src/components/progress/ClearStarsButton';

<div
  className="gold-glow"
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid rgba(212,175,55,0.25)',
    borderRadius: 12,
    padding: '8px 14px',
    marginBottom: '36px',
    position: 'relative',
    zIndex: 10,               // 🪄 brings it on top
    backgroundColor: '#0a0a0a', // ensures visibility
  }}
>
  <ChapterStars chapterId="monte-carlo" showLabel />
  <ClearStarsButton chapterId="monte-carlo" />
</div>

import TryIt from '@site/src/components/tryit/TryIt';

## Mini Lab — Monte Carlo π

{/* Visual explainer box under the terminal */}
<div className="gold-glow" style={{marginTop:'12px', border:'1px solid rgba(212,175,55,0.25)', borderRadius:12, padding:'36px'}}>
  <div style={{color:'#d4af37', fontWeight:600, marginBottom:6}}>Monte Carlo Geometry</div>
  <img src="/img/monte-carlo-circle.png" alt="Quarter circle inside unit square"
       style={{maxWidth:'860px', width:'100%', borderRadius:30}} />
  <div style={{color:'#9fb3c8', fontSize:13, marginTop:6}}>
    π ≈ 4 × (points inside x²+y² ≤ 1) / n, with (x,y) uniform in [0,1]².
  </div>
</div>

<TryIt
  id="mc-pi"
  chapterId="monte-carlo"
  packWeight={3}
  starTotal={3}
  title="Estimate π with Monte Carlo"
  intro="Write mc_pi(n) that estimates π by sampling n points in the unit square and counting the fraction inside the quarter circle."
  packs={[
    {
      id: 'mc-pi',
      name: '⭐ Estimate π with Monte Carlo',
      // Shown on the tile (keeps it consistent with your other pages)
      question: 'Implement mc_pi(n): sample n points with random.random(), count hits where x*x + y*y ≤ 1, and return 4.0 * hits / n',
      detect: "def\\s+mc_pi\\s*\\",
      scaffold: `import random, math

def mc_pi(n):
    \"\"\"Return an estimate of π using n random points in [0,1]^2.
    Steps:
    1. hits = 0
    2. for i in range(n): draw x,y in [0,1]
    3. if x*x + y*y <= 1: hits += 1
    4. return 4.0 * hits / n
    \"\"\"
    # TODO: implement
    return 0.0
`,
      hint: `💡 Hint

Use Python's stdlib only:
- import random, math
- Use random.random() for x and y
- Count hits, don't sum x*x+y*y
- Return a float: 4.0 * hits / n`,
      weight: 0.75,
      tests: [
        {
          // Make the test label itself descriptive—users see the full expr in the Tests tab
          expr: "import random, math; random.seed(0); abs(mc_pi(200000) - math.pi)",
          expected: 0.01,
          tol: 0.01,
        },
        {
          expr: "import random, math; random.seed(1); abs(mc_pi(20000) - math.pi)",
          expected: 0.05,
          tol: 0.05,
        },
      ],
    },
  ]}
/>



