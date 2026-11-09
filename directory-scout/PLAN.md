# Veer Directories — AI SEO Business Plan (draft v1)

## 1. What this is

Build **niche local directories**, one niche per site with a page for each city. An example
is *"Ice Dam Removal Pros — Twin Cities"*. Each site lists every business in that niche,
with real, structured details that Google Maps doesn't show, like licensing, emergency
service, financing and price ranges.

The pages are built to answer the question a homeowner types into Google **and** asks
ChatGPT, Perplexity or Google's AI Overviews: *"Who's the best ___ in Woodbury?"* AI
assistants build those answers from sources they trust: business websites, review
platforms, Reddit and well-structured directories. A clean, accurate, frequently updated
niche directory is the kind of page they cite.

### Why it fits Veer
The directory is not the whole business. **It's the front door to everything Veer already sells.**

| Directory gives you | Turns into |
|---|---|
| A complete list of every business in a niche, by city | A prospect list you didn't have to buy |
| A reason to contact them ("you're listed, here's how your profile scores") | A warm opener in place of a cold pitch |
| A Veer Local Score for each listing (GBP audit) | Profile Rescue ($300), Google Care ($85/mo), Care Plus ($150/mo) |
| Listings with no website or a weak one | Website build ($500) + Veer Care ($25/mo) |
| Traffic and leads you control | Featured listings and lead sales (new revenue line, priced below) |
| A live example ranking in Google and AI answers | Proof when you sell "AI visibility" to other clients |

So "selling AI SEO" works on two levels. You **own** the asset that ranks, and you **sell**
the AI-visibility work it shows you know how to do.

---

## 2. Revenue streams (in the order they'll actually show up)

1. **Veer services sold to listed businesses.** These are your existing prices. This is
   the fastest money, because it doesn't wait on traffic.
2. **Featured listings.** You pay monthly for the top spot on a city page, a "Verified"
   badge and photos. Industry guides put niche directory listings at roughly $29–$99/mo.
   *Your price: still to decide; test something like $49–$99/mo.*
3. **Lead sales or referral fees.** Use a "Get 3 quotes" form on the site. You send leads to
   featured businesses, or charge per lead once volume exists.
4. **Later:** sponsored guides, newsletters, or selling the whole directory. Directories that
   earn money sell for a multiple of their yearly profit.

> Note: #2 and #3 are new offers that aren't on Veer's pricing page. Decide those numbers
> before anything client-facing mentions them.

---

## 3. Picking niches — the scorecard

A good directory niche has all of these:

- **High-ticket local service.** A job worth $500+ means a business will gladly pay $79/mo.
- **Market size of 40–300 businesses in the metro.** Fewer than that is too thin. Much more
  than that and big players (Angi, Yelp, Thumbtack) own it.
- **Customers filter on things Google doesn't show.** Examples: "licensed in MN",
  "24/7 emergency", "offers financing", "insured", "warranty years". This is your unique data,
  and it's what keeps the site from looking like a thin copy of Google Maps.
- **Weak search results today.** Search the main keyword plus a city. If the top results are
  generic Yelp/Angi pages or random business sites with no comparison, there's an opening.
- **Weak online presence among the businesses themselves.** This is a high % with no website
  or under 25 reviews. That makes it a bigger Veer upsell pool. The script records this.
- **Minnesota advantage.** Seasonal, weather-driven niches where out-of-state SEO farms won't
  bother. Ice dams, snow removal, basement waterproofing and foundation work all fit.

### Starter niche candidates (Twin Cities)
| Niche | Why it's interesting |
|---|---|
| Ice dam removal | Very MN. Urgent, high-ticket, seasonal spikes. Few good comparison pages. |
| Basement waterproofing / foundation repair | $5k–$30k jobs. Trust-heavy. Licensing matters. |
| Epoxy garage floor coating | Growing, fragmented, lots of small operators with weak websites |
| Med spa | High ticket and high marketing budgets. Compares well on treatments and pricing. |
| Dog daycare / boarding | Lots of filterable attributes (size limits, cameras, grooming) |
| Mobile dog grooming | Small operators, often no website, so a strong Veer upsell |
| Auto detailing / ceramic coating / window tint | Owner-operators, Instagram-only, so a strong upsell |
| Sauna / cold-plunge studios | Trendy, small count, likely to be cited by AI |
| Tree service, junk removal, snow removal | High volume, but more competitive (check results) |

These are all pre-loaded in `niches.txt`.

---

## 4. Step 1 — Count businesses by niche × city

`scout.py` runs each niche in each city through the Google Places API. It writes `counts.csv`
with these columns:

- **count**: how many businesses (the API caps each search at 60, so "60+" means a big market)
- **pct_no_website**: share of businesses with no website, which is your website-build pool
- **pct_under_25_reviews**: share with few reviews, which is your GBP / Care pool
- **avg_rating**

```bash
export GOOGLE_PLACES_KEY=your_key      # Google Cloud → enable "Places API (New)"
python3 scout.py niches.txt cities.txt # → counts.csv
```

13 niches × 21 cities is about 273 searches. That fits in Google's free monthly usage at
this scale, but check the current Maps Platform pricing page before running big batches.

**Important legal note:** Google's terms don't let you copy Places data (names, reviews,
photos) into your own directory. Use Places **only to size the market and find businesses**.
Fill the actual listings from the businesses' own websites, the MN Dept. of Labor & Industry
contractor license lookup, the Secretary of State business search, and direct contact with
the businesses themselves. That human-checked data is your edge anyway.

### Then validate the top 3 niches by hand (about 1 hour each)
1. Google Keyword Planner (free) or Ahrefs/Semrush: monthly searches for "[niche] [city]"
   and "[niche] near me" across the metro.
2. Google the main keyword in 3 cities and note who ranks.
3. Ask ChatGPT, Perplexity and Gemini "best [niche] in [city]". Note which sources they cite.
   If they cite thin or generic sources, that's your opening.
4. Pick **one** niche to build first.

---

## 5. Step 2 — Build the first directory

**Stack:** Use the same setup you already use. That's a static site on Vercel generated from
a spreadsheet or JSON file (Astro or a simple build script), with a GitHub repo per directory.
Cost is a domain (~$15/yr) plus free hosting.

**Pages**
- Home: the metro overview, with search and filters
- `/[city]/`: "Best [niche] in [City]". This has the list, filters, a short local guide and an FAQ.
- `/[city]/[business]/`: one profile per business with all verified attributes
- Guides: "How much does ice dam removal cost in Minnesota?", "Steaming vs. chipping ice dams".
  These are the pages AI assistants love to quote.
- "Claim your listing" / "Get featured" page

**AI-SEO checklist (what makes it citable)**
- schema.org markup on every page: `LocalBusiness`, `ItemList` for city lists, `FAQPage`
- A plain-language answer at the top of each page ("There are 14 ice dam removal companies
  serving Woodbury. 6 offer 24/7 emergency service…")
- "Last verified: [date]" on every listing, and keep it true
- Real methodology page: how businesses are listed and ranked, and that featured spots are
  marked as ads
- Submit to **Bing Webmaster Tools** (ChatGPT search leans on Bing) and Google Search Console.
  Turn on IndexNow.
- `llms.txt` and a clean sitemap
- No 500 AI-written look-alike city pages. Google penalizes mass-produced thin pages. Only
  publish a city page when it has real listings and real data.

**Data workflow per business:** find (Places/scout) → visit website + license lookup → record
attributes in the sheet (Claude can extract them from each website, and you spot-check) → run
the Veer GBP audit → publish.

---

## 6. Step 3 — Launch and get links
- Give every listed business a **"Featured on [Directory]" badge** to put on its website. Each
  one is a backlink.
- Post genuinely useful guides on local Reddit (r/TwinCities, r/minnesota) and in Nextdoor and
  Facebook groups. Don't spam.
- Get listed on local chamber / "Minnesota resources" pages.
- Track rankings and AI mentions monthly. Re-run the same ChatGPT/Perplexity prompts and log
  whether the directory gets cited.

---

## 7. Step 4 — Turn listings into Veer clients
Outreach script (email + phone, then the NFC stand in person):

> "Hi ___, your business is listed on [Directory], the Twin Cities guide to ice dam
> removal. I ran your Google profile through our checker and it scored 54/100. Here are the 3
> things holding it back. Want me to send the full report? Claiming your listing is free."

Order of offers: **free claim → free audit → Profile Rescue / Rescue+Care bundle ($500) →
website if needed → featured listing once traffic is real.** Never promise rankings.

Track it in one sheet: business, city, score, contacted, claimed, bought, MRR.

---

## 8. 90-day timeline
| Weeks | Do this | Done when |
|---|---|---|
| 1 | Settle goal + geography. Get a Places API key. Run `scout.py`. | `counts.csv` exists |
| 2 | Validate top 3 niches by hand. Pick one. Buy the domain. | One niche chosen |
| 3–5 | Build the template. Collect and verify data for the core 10 cities. | Site live on Vercel |
| 5–6 | Write 4–6 guides. Add schema. Submit to Search Console + Bing. | Pages indexed |
| 6–12 | Outreach: about 10 businesses/week. Badges and backlinks. Run monthly AI-citation checks. | First Veer sales from listings |
| 12+ | If it works: niche #2 with the same template, or expand to Rochester/Duluth/St. Cloud | — |

**Realistic expectations:** service revenue from outreach can start in month 1–2. Search and
AI traffic usually takes **3–9 months** to build. Featured-listing revenue comes after that.
Plan on the directory paying for itself through Veer services first.

### Rough first-niche math (illustrative, not a forecast)
150 businesses listed → contact all → 5% buy a Rescue or bundle (~8 × $300–$500 ≈ $2.4k–$4k
one-time) + some convert to Google Care ($85/mo). Later, 5–10 featured listings at ~$79/mo is
$400–$800/mo recurring. Each extra niche reuses the same template, so the second one is
much faster to build.

---

## 9. Risks and how to handle them
- **Thin-content penalty.** Only publish pages with real, verified data. No mass-generated pages.
- **Data accuracy.** Show "last verified" dates. Re-verify quarterly. Make it easy to request a fix.
- **Google ToS.** Use Places for counting only (see section 4).
- **Slow traffic.** The model doesn't depend on traffic at first. Outreach-driven service sales
  carry it.
- **Conflict of interest.** Clearly label featured/paid placements. Never let payment change
  the "verified" facts.

---

## Open questions
1. **Main goal:** is the directory mainly a lead engine for Veer services, or a standalone
   income asset (featured listings + lead sales)? This changes niche choice: weak-presence
   niches suit the first, high-budget niches suit the second.
2. **Geography:** Twin Cities metro only, all of Minnesota, or national niches?
3. Any industries you already know well or have contacts in?
4. Do you have (or want) a Google Places API key so the counts can be run?
