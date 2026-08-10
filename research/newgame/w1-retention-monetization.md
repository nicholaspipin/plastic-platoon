# W1 — Retention & Monetization Science for a New Solo-Dev Game (2025–2026)

Research date: 2026-08-10. Compiled from ~15 web searches / source fetches. All numbers are the most recent published figures found (2025 data reported in 2026 reports unless noted). Sources at the end of each section.

---

## 1. Retention benchmarks by genre (D1/D7/D30)

### The 2026 cross-genre picture

| Tier | D1 | D7 | D30 |
|---|---|---|---|
| Industry median (all games) | ~26% | ~10% | ~3–4% |
| "Good" (realistic target for a quality new game) | 30–35% | 15% | 5% |
| Top quartile | 40%+ | 20%+ | 10%+ |
| Match-3 with top-grossing ambitions (install-weighted competition) | 47% | 24% | 13% |

- Day 1 retention averaged **~27% in 2025** and held roughly flat YoY; some broader 2026 medians (including junk installs) have slipped to ~22% D1 / 4% D7 / <1% D30 as attention competition intensifies. Top 25% of games by end of 2024: D1 26.5–27.7% (slightly down from 28–29% in 2023).
- Genre spreads: **Puzzle** ~31.9 / 12.2 / 5.4; **Match** ~32.7 D1 and 7.2 D30; **hyper-casual** D30 ~1.4%. Arcade posts strong D1 but fades fast; **board/card/puzzle and idle titles frequently match or beat RPG-level D7/D30**.
- **Idle/incremental specifics** (relevant to this project): top idle games hit up to **42% D1**; well-paced idle loops see **D7 of 10–15%** vs the ~8% typical benchmark; idle player stickiness (DAU/MAU) ~**18%** vs 10.5% for hyper-casual.
- Business-model caveat: subscription-monetized apps average **14% D30 vs 5.4%** for ad-supported (2.5x gap) — compare within your own model.
- Diagnostic framing (Playio, 2026): low D1 = first-session/acquisition-quality problem; low D7 = core-loop or daily-incentive gap; low D30 = content depth / LiveOps calendar gap.

**What "good" looks like in 2026 for a new solo-dev title:** clear 35/15/5 and you're genuinely competitive; 40/20/10 is a breakout signal worth spending UA against.

Sources: [Segwise retention benchmarks](https://segwise.ai/blog/mobile-gaming-app-user-retention-strategies), [Playio D1/D7/D30 benchmarks 2026](https://blog.playio.co/d1-d7-d30-retention-benchmarks-2026), [GameAnalytics 2026 benchmarks report](https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks), [Gamigion](https://www.gamigion.com/retention-benchmark-for-games-in-2026/), [GameGrowthAdvisor KPIs](https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-kpis-benchmarks-2026/), [adjoe idle games](https://adjoe.io/glossary/idle-games-mobile/), [Gamigion idle engagement](https://www.gamigion.com/idle/)

---

## 2. First session & FTUE — what the data says about D1 drop-off

### Time-to-fun targets (2026 consensus numbers)
- **Core gameplay within 60 seconds; the "aha/this-is-fun" moment within 90 seconds.** If the aha takes >90s, a significant share of users never return for session two.
- Top hyper-casual games with D1 >50% keep tutorials **under 30 seconds** and let players take meaningful action immediately.
- First-run guided tour: **two steps or fewer**; players who fail (lose/get stuck) in the first 60 seconds churn at dramatically higher rates — early FTUE should make failure nearly impossible.

### What actually predicts retention
- The single most predictive metric for D30 retention is **completion of a meaningful first action in session one** — not D1 return itself, not raw session length.
- Users reaching a meaningful first action **within 3 minutes** show significantly higher D7 than apps with longer setup.
- A **10–15 minute first session that accomplishes a concrete goal** lifts D1/D7.
- Tutorial completion is a leading indicator: example cohort split of **25% D30 for tutorial completers vs 8% for skippers/failers**.

### Design principles (Keewano / Antidote / GameRefinery synthesis)
1. Real gameplay as fast as possible; defer every complex system until after emotional investment.
2. Early challenge that is genuine but guaranteed-winnable (competence feeling).
3. Progressive disclosure: unlock systems over days, not in the first session.
4. Instrument the FTUE funnel step-by-step; the biggest D1 lever is fixing the single worst-dropping step, not adding content.

Sources: [Playio onboarding](https://blog.playio.co/mobile-game-onboarding-retention), [Keewano FTUE](https://keewano.com/blog/first-time-user-experience-ftue-mobile-games/), [Antidote FTUE playbook](https://antidote.gg/ftue-the-antidote-playbook/), [Recognizing Patterns — first 60 seconds](https://recognizingpatterns.substack.com/p/first-time-user-experience-your-player), [Countly player retention metrics](https://countly.com/blog/player-retention-analytics-the-metrics-that-predict-long-term-game-success), [UXCam benchmarks](https://uxcam.com/blog/mobile-app-retention-benchmarks/)

---

## 3. Hybrid-casual monetization playbook (2026)

### The macro shift
- Hyper-casual (pure ads) is over as a business; the industry moved to **hybrid-casual = ad-based core + IAP meta**. Hybrid-casual IAP revenue grew **+37%** while total mobile IAP grew only ~4% (to $82B, 2024).
- Revenue split by hybrid subgenre (Sensor Tower, State of Gaming 2026): lifestyle/puzzle **59% IAP / 41% ads**; sports/racing 71/29; action/strategy 82/18. Rules of thumb: hardcore ~70/30 IAP:ads, casual ~50/50, hyper-casual 90/10 ads:IAP. Idle games: ads are often 60–70% of revenue with modest IAP.
- Hybrid LTV runs **3–5x pure hyper-casual**. Tier-1 CPI for hybrid-casual: **$2.50–$6.00** (US casual/puzzle Android $1.50–$3.50). Viability test: CPI should sit at ~30–70% of projected LTV.

### Ad formats and cadence
- **Rewarded video is the backbone**: 85–95% completion rates when rewards feel meaningful; top gaming apps derive **50–70% of ad revenue from rewarded** alone. ARPDAU rises **30–66%** after adding rewarded placements. Idle games average ~**73 rewarded videos per user** lifetime — the passive mindset makes "watch 30s for 2x income" feel fair.
- **Interstitial cadence**: consensus is one per **3–5 minutes** of session time (minimum 2–3 min gap), max one per user-initiated transition, never mid-action. Exceeding ~1 per 2 minutes drops **D7 by up to 20%**; an interstitial after every level in casual puzzle loses 15–25% of players in session one. **Suppress interstitials entirely for payers** (their IAP LTV exceeds ad LTV; ads suppress future purchases).
- **eCPM realities 2026**: rewarded video **$15–40 Tier-1** (US ≈ $16–20), $8–18 global average, $3–10 Tier-2/3. Interstitial **$5–8 Tier-1**, $2.50–5 global. Banners near-worthless except as filler. iOS still out-earns Android but the gap narrowed; note casual Android rewarded eCPM *fell* from $3.60 (H1 2023) to $3.02 (H1 2025) — don't build a plan on rising eCPMs. Japan/Korea/UAE/Saudi rival Tier-1 for games.

### IAP layering (in order of introduction)
1. **Remove-ads / starter pack ($0.99–$4.99)** — the conversion unlock. Players who make one purchase are **5–10x** more likely to buy again; one case study: a $0.99 starter pack moved payer conversion **0.02% → 2.8%** in two weeks. Best shown not at tutorial-end but at first friction/resource-pinch or a milestone, ideally **day 3–7**, time-limited. Deconstructor of Fun's counterpoint: don't price *too* low — the pack's job is conversion, but anchoring matters.
2. **Battle pass** — used by **~60% of top-20% top-grossing US titles**; the #1 IAP revenue category alongside currency. Works when there's a session-frequency habit to reward; typically needs a 3–4 week season cadence you must sustain (see §6).
3. **Piggy bank** — 9th IAP category by revenue (behind currency, battle pass, ad-removal; ahead of gacha, starter packs). Works only after engagement is established; it's rarely a first purchase. Make it obviously better value than shop offers.
4. Payer-behavior facts: target **2–5% payer rate** (global average of gamers who ever buy: ~1.8%); top 5% of spenders = 48% of IAP revenue; only **28.8% of purchasers ever spend again**, and 92% of repeat spenders make purchase #2 within 30 days — so the two weeks after first purchase are the highest-leverage monetization window. 71% of purchases are single-use items but **65% of revenue is lifetime items**; a day-1 lifetime purchase (e.g., remove-ads) is itself a retention driver.
- ARPDAU reference points: all-games average **~$0.09** (2024); casual target ~$0.10–0.20 realistic for indie (the $0.80 casual / $1.50 midcore figures cited by agencies are top-grossing targets, not medians).

Sources: [Airflux hybrid meta-systems](https://airflux.ai/blog/beyond-ads-hybrid-meta-systems-iap-growth-2026), [GGA hybrid-casual 2026](https://gamegrowthadvisor.com/blog/2026-04-16-hybrid-casual-game-design-strategy-2026/), [RevenueFlex eCPM benchmarks 2026](https://revenueflex.com/blog/app-ad-revenue-benchmarks-2026/), [Playio rewarded benchmarks](https://blog.playio.co/rewarded-ad-benchmarks-2026), [Tenjin ad-mon report 2026](https://tenjin.com/blog/ad-mon-gaming-2026/), [AdReact interstitial best practices](https://adreact.com/blog/interstitial-ad-best-practices-mobile-games/), [Adapty interstitials](https://adapty.io/blog/mobile-interstitial-ads/), [GameRefinery IAP mechanics](https://www.gamerefinery.com/boost-your-monetization-with-iap-mechanics/), [Maf.ad piggy banks](https://maf.ad/en/blog/piggy-banks-in-games/), [SolarEngine first-purchase guide](https://blog.solar-engine.com/en-blog/docs/From-Player-to-Payer-The-Guide-to-Cracking-FirstPurchase-Conversion-in-Mobile-Games), [DoF starter-pack pricing](https://www.deconstructoroffun.com/blog/2024/4/8/free-to-play-starter-pack-pricing-when-conversion-is-king-we-may-price-too-low), [Mistplay IAP guide](https://business.mistplay.com/resources/in-app-purchases-mobile-game), [MAF conversion/IAP benchmarks](https://maf.ad/en/blog/mobile-game-conversion-rates/), [Antier hyper vs hybrid](https://www.antiersolutions.com/blogs/hybrid-casual-games-vs-hypercasual-whats-driving-higher-retention-ltv-and-revenue-in-2026/), [Udonis casual market](https://www.blog.udonis.co/mobile-marketing/mobile-games/casual-games)

---

## 4. Session design, appointment mechanics, streaks, FOMO vs ethical retention

### Session shape by genre (2025 data)
- Median mobile session ~**5–6 min**; top-quartile games 8–9 min. Players average **4–6 sessions/day** across genres.
- Hyper-casual/puzzle: <3 min sessions, 8–10/day. RPG/strategy: 15–30 min, 2–4/day. Idle: ~**8 min average sessions**, many/day (check-in pattern). Daily playtime: casual ~28 min/day, midcore top performers ~34 min/day.
- Design implication for an idle/hybrid game: build for a **2–8 minute session that always ends with a scheduled reason to return** (production completes, chest timer, offline earnings cap ~2–4h early on).

### Appointment mechanics — current thinking
- The old model (energy gates, artificial stopping points that *postpone* value) is fading; modern LiveOps **shifts value into the session** rather than deferring it. Timers should create *anticipation* (something good is ready when you return), not *denial* (you may not play now).
- Offline/idle earnings caps are the idle genre's native appointment mechanic — the cap itself sets session frequency; tune it so the optimal check-in matches your target sessions/day.

### Streaks (Duolingo evidence)
- 7-day streak users are **3.6x** more likely to complete their course; streak ≥7 days = **2.4x** more likely to return next day. Duolingo cut monthly churn from 47% (2020) to 28% (2023) and grew DAU >10x since 2019.
- Mechanism is **loss aversion** (protecting the streak) more than achievement. The ethical line, per current UX literature: streaks need **mercy infrastructure** — streak freezes, repair, grace windows. Products with repair options retain users through illness/travel/grief; shame-based streaks churn them permanently when the streak breaks. Rule: reward presence, never punish absence.

### FOMO vs ethical retention — the regulatory picture (important for 2026)
- **EU Digital Fairness Act** draft expected **end of 2026**: one instrument covering dark patterns, addictive design, loot boxes, virtual currencies, personalized pricing. Netherlands pushing for an outright loot-box ban; PEGI now age-gates paid loot boxes at 16. ~70% of consultation respondents want binding rules: real-money price display for in-game currency, odds disclosure, child protections.
- **US**: FTC treats loot boxes as potential dark patterns for under-16s; Feb 2026 NY AG suit alleges a major developer's paid loot boxes constitute illegal gambling ("resembles a slot machine"). False-scarcity countdown timers are explicitly named in dark-pattern taxonomies.
- **Practical guidance for a new game**: avoid paid loot boxes/gacha entirely (solo dev cannot carry compliance risk); avoid fake countdown timers (real, honest time-limits are fine); show real-money prices; prefer "earnable + buyable" dual paths (also the pattern data says lifts ARPDAU). Ethical retention (streak freezes, honest timers, value-in-session) is now both the reputational and regulatory-safe choice — and Duolingo demonstrates it retains *better*.

Sources: [Game Design Bites — modern LiveOps](https://gamedesignbites.substack.com/p/liveops-retention-mobile-games), [GameAnalytics 2025 benchmarks](https://www.gameanalytics.com/reports/2025-mobile-gaming-benchmarks), [TechRT gaming time stats](https://techrt.com/mobile-gaming-time-statistics/), [UX Magazine — hot streak design](https://uxmag.com/articles/the-psychology-of-hot-streak-game-design-how-to-keep-players-coming-back-every-day-without-shame), [Yu-kai Chou streak design](https://yukaichou.com/gamification-study/master-the-art-of-streak-design-for-short-term-engagement-and-long-term-success/), [Digia — Duolingo retention architecture](https://www.digia.tech/post/duolingo-habit-forming-reminders-retention-architecture/), [Chambers — Digital Fairness Act & games](https://chambers.com/articles/digital-fairness-act-what-the-public-consultation-tells-the-video-game-industry), [Freshfields DFA guide](https://www.freshfields.com/en/our-thinking/blogs/technology-quotient/the-eus-proposed-digital-fairness-act-a-game-developers-guide-to-potential-imp-102ltio), [Promise Legal loot box regulation 2026](https://blog.promise.legal/lootbox-regulation-2026-game-studios/), [Rain Intelligence dark-pattern lawsuits](https://www.rainintelligence.com/blog/dark-patterns-in-gaming-lawsuits-target-manipulative-monetization-tactics)

---

## 5. Premium & web-distributed alternatives (post-Epic rules, 2026)

### The Balatro model (premium, no ads, no IAP)
- Balatro: $9.99 premium (mobile at $9.99, PC $14.99). **$21.3M revenue on ~3.1M mobile downloads**; ~$1M in first 7 days on mobile; >$10M on Steam alone. Proof that a premium mobile hit is possible in 2025–26 — but it rode a massive PC/press wave first. Premium mobile is rising overall (Pocket Tactics), yet remains hit-driven.
- Steam reality check for premium: indie revenue on Steam ≈ **$4.5B in 2025** (~25% of platform), but **median indie game grosses ~$250–5K lifetime**; top 5% clear $1M. 5,863 games earned >$100K in 2025 (vs ~3,000 in 2020) — the middle class is growing. Median launch price of top-50 new releases fell to ~**$15.64**; the winning pattern is **$15–20 price + quality above expectations**, not $30.

### Post-Epic store rules (US, as of mid-2026)
- **Apple/iOS**: Since May 2025, US apps may include buttons/links to external web payments with **no Apple commission**. Dec 2025 Ninth Circuit: Apple *may* eventually charge a "reasonable commission" (costs + some IP compensation, excluding security/privacy costs) but **cannot charge yet** — rate awaiting district-court determination. Apple cannot force external links to be less prominent than its own IAP button. The old 27% external-link fee is dead; economics currently favor linking out.
- **Google/Android**: the Oct 2024 Epic v. Google injunction governs (July 2026: Epic and Google withdrew their settlement). Google **cannot require Play Billing**, cannot ban alternative in-app payment methods, cannot prohibit telling users about cheaper options. Third-party app stores began distribution inside Play on **July 22, 2026**. External-links/alt-billing program fees are announced to start **Oct 1, 2026** but are currently switched off.
- **Web shops / D2C**: top mobile publishers already route **25–30% of revenue** through web shops. Provider take rates: Xsolla ~**5%**, Paddle 5% + $0.50; Stash/Appcharge/Neon similar single-digit territory; **Unity's new D2C offering charges 0%**. Stripe direct is ~2.9% + $0.30. Net: a D2C dollar keeps ~92–97¢ vs ~70¢ (or 85¢ under small-business programs) on-store.
- Both stores still offer **15% small-business tiers** (<$1M/yr) — for a solo dev, the on-store cut is 15%, not 30%, which shrinks the D2C advantage to ~10 points; D2C's bigger prize is **owning the customer relationship and email list**.

### Web-native distribution (no store at all)
- Poki: **625M players in 2025, 100M MAU**; CrazyGames: 35M MAU, ~$13.6M revenue (2026). A well-performing portal game typically earns **$200–$2,000/month** in ad rev-share; rare top studios reach ~€1M/yr on Poki.
- Rev shares: Poki 50/50 on portal-sourced traffic, **100% to dev on your own traffic**; CrazyGames ~60% of ad revenue, ~**70% of in-game purchase revenue** to the dev (2026 terms). CrazyGames SDK supports web IAP.
- Strategic read for a solo dev: web is a **zero-CPI discovery channel** (portals bring the traffic) and a funnel to your own domain where Stripe-based payments keep ~97%. Best used as: free web demo/core on portals → premium unlock or account upsell on your own site → optional mobile wrapper later.

Sources: [PocketGamer.biz Balatro mobile](https://www.pocketgamer.biz/balatro-nears-44m-on-mobile-amid-a-sudden-spending-surge/), [Pocket Tactics premium rise](https://www.pockettactics.com/premium-mobile-games-increase), [Balatro — Wikipedia](https://en.wikipedia.org/wiki/Balatro), [MacRumors Ninth Circuit ruling](https://www.macrumors.com/2025/12/11/apple-app-store-fees-external-payment-links/), [RevenueCat anti-steering analysis](https://www.revenuecat.com/blog/growth/apple-anti-steering-ruling-monetization-strategy), [TechCrunch May 2025 App Store change](https://techcrunch.com/2025/05/02/apple-changes-us-app-store-rules-to-let-apps-redirect-users-to-their-own-websites-for-payments), [Stash — Epic v Google update](https://www.stash.gg/blog/blog-epic-v-google-settlement-update-april-2026), [Google Play US policy update](https://support.google.com/googleplay/android-developer/answer/15582165?hl=en), [Neon — Google billing policies](https://www.neonpay.com/blog/google-plays-new-u.s.-billing-linking-policies-what-game-developers-need-to-know), [Metaplay web-shop comparison](https://www.metaplay.io/blog/picking-the-right-web-shop-for-your-mobile-game), [GameMakers — Unity D2C at 0%](https://www.gamemakers.com/p/the-most-important-number-in-unitys), [Felix Braberg — web shops 30% of revenue](https://felixbraberg.substack.com/p/web-shops-make-up-30-of-game-revenue-de8), [Cinevva web-game monetization data](https://app.cinevva.com/guides/web-game-monetization), [Game Developer — hidden web game market](https://www.gamedeveloper.com/business/the-huge-hidden-web-game-market-no-one-talks-about-and-how-to-get-in-), [CrazyGames dev portal](https://developer.crazygames.com/), [SteamPageAnalyzer revenue data](https://www.steampageanalyzer.com/blog/indie-game-revenue-data), [ShaneTheGamer indie stats](https://www.shanethegamer.com/research/indie-games-statistics/), [GTSTU Steam pricing guide](https://gtstu.com/steam-indie-game-pricing-strategy/)

---

## 6. LiveOps expectations for a small team

### What the market runs (context, not target)
- Average LiveOps events/month across tracked titles rose **73 → 89 in 2025** (AppMagic) — driven by tighter scheduling of *repeatable* templates, not new event types. Midcore averages ~76 events/month via longer, fewer-launch events; casual runs shorter, denser events. Milestone progression and repeatable tournaments dominate; short-term collection albums are replacing long-running albums. 2026 trend: continuous flow — finishing one activity rolls directly into the next.
- You cannot and should not match this as a solo dev. The relevant lesson is **templatization**: top studios run the *same 3–5 event types* on a calendar, reskinned. Build each event system once, run it forever.

### Sustainable solo/indie cadence (StraySpark + synthesis)
- **Content updates every 4–6 weeks**, announced honestly — under-promise. Batch community responses; no daily obligations.
- Minimum viable LiveOps stack for one person, in priority order:
  1. **Daily**: login/streak reward + 2–3 daily missions (fully automated).
  2. **Weekly**: one repeatable event from a single template (tournament/leaderboard or milestone event) — config-driven, no new build required.
  3. **Monthly/seasonal (3–4 wks)**: pass season or themed reskin of the weekly template; this is also the battle-pass cadence if you run one.
  4. **Quarterly**: one real content drop (new zone/mechanic) aligned with a marketing beat.
- Prerequisites that make this survivable: remote config + server-side event scheduling from day one; analytics on the FTUE funnel and event participation; a hotfix path. Organizationally, small autonomous ownership (which a solo dev has by definition) is what the 2026 LiveOps literature says actually improves delivery stability.
- Warning from the 2025 data: only add a battle pass if you can guarantee the seasonal cadence indefinitely — a lapsed season damages trust more than never having one.

Sources: [StraySpark indie LiveOps guide](https://www.strayspark.studio/blog/liveops-indie-developers-post-launch), [AppMagic LiveOps Report 2025](https://mobidictum.com/appmagic-liveops-report-2025/), [Mobidictum LiveOps 2026 trends](https://mobidictum.com/liveops-in-2026-trends-pressures-what-comes-next/), [Game Design Bites LiveOps](https://gamedesignbites.substack.com/p/liveops-retention-mobile-games)

---

## Synthesis: recommended monetization shape for a solo-dev breakout attempt

Given the numbers above, the highest-probability shape for a new solo-dev game (especially an idle/hybrid-casual with a web build) is:

1. **Hybrid-casual, rewarded-first**: rewarded video as the ad backbone (2x offline earnings, skip timers, bonus chests — always opt-in, always fair-feeling). Interstitials only for non-payers, ≥3 min apart, never mid-action; kill them for anyone who has spent.
2. **Three-rung IAP ladder**: (a) $2.99–4.99 remove-ads/starter pack surfaced at first friction around day 2–4 (the conversion unlock — expect payer rate to move from ~0% to 2–3% on this alone); (b) a single evergreen "supporter" lifetime pack; (c) *only after* PMF: a modest seasonal pass. No gacha, no paid loot boxes, no fake timers — regulatory direction (EU DFA, NY AG suit) and the Duolingo evidence both say ethical retention wins anyway.
3. **Web as a parallel channel**: portal build (Poki/CrazyGames = free discovery, $200–2K/mo ceiling) funneling to your own domain where Stripe/Xsolla keeps 95–97% of any purchase, plus email capture. On-store, enroll in the 15% small-business tiers; in the US you may link out to web payments (currently 0% Apple fee, Google fees off until Oct 2026).
4. **Gate everything on retention first**: don't spend on UA or build monetization depth until organic cohorts clear ~35/15/5. Fix D1 with the 60s-to-gameplay / 90s-to-fun FTUE bar; fix D7 with the daily loop + streak-with-mercy; fix D30 with the 4–6-week content cadence.
