# Social media questionnaire — plain text

The same questions as `intake.html`, for when a form isn't the right tool: reading them
down a phone call, pasting into an email, or printing for an in-person meeting.

**On a call, don't read this like a script.** The starred (★) questions are the ones that
actually change the price — get those and you can quote. Everything else can come later.

---

## 1 · The basics

- Business name
- Your name
- Phone / email
- City or neighborhood you serve
- In one sentence, what does the business do? *(however you'd say it to someone at a bar)*
- Website, if you have one

## 2 · Where you are now ★

**For each of Instagram, Facebook, TikTok, YouTube, LinkedIn, Pinterest:**

> Active — we post · Have it, it's been sitting · Don't have one, build it · Not for us

- Do you have a Google Business Profile? *(yes claimed / not sure / no)*
- Who has the logins? *(me / a staff member / a former employee or agency / nobody knows)*

> Say this part out loud, every time: **every account stays theirs**, including ones Veer
> builds. Delegated access, never their personal password, everything hands back.

## 3 · What you want

- Pick one or two: more foot traffic · more calls or bookings · online orders or sales ·
  look established · keep up with a competitor · launch something · hiring · stop being
  embarrassed by it
- What does a good month look like, in your words?
  *("Ten more catering calls" beats "more engagement.")*
- Is anyone doing this for you now? *(nobody / me when I remember / a staff member /
  an agency or freelancer)*

## 4 · Content

- What should we post about? *(products or menu · behind the scenes · staff or owner ·
  customers & reviews · deals · events · tips & how-to · before & after · new arrivals)*
- How many usable photos or videos do you already have? *(hundreds / a handful / almost none)*
- Could someone there snap a few phone photos each week? *(yes / sometimes / no, you'd
  need to come shoot)*
- Short video — reels, TikToks? ★ *(yes that's the point / some would be nice / not
  interested / no idea)*
- **Anything we should never post?** *(prices, a location, certain staff, a family member,
  a competitor's name)*
- Two or three accounts whose vibe you like

## 5 · Rhythm

- How often should something go out? ★ *(2 a week / 4 a week / daily-ish / not sure)*
- How many locations? ★
- Who approves posts? *(me / me and a partner / a manager / nobody, just post it)*
- How fast can that person look at a month of posts? *(same day / two or three days /
  a week honestly)*
- Who answers comments and DMs today? *(nobody / me eventually / staff same day /
  I'd want you to handle it)*

## 6 · Paid ads ★

- Where are you on ads? *(yes now / maybe in a few months / no / tell me if I should)*

**Only if yes or maybe:**

- Which platforms? *(Facebook + Instagram counts as one · Google · TikTok · LinkedIn ·
  not sure)*
- Monthly ad budget you'd be comfortable with — total, paid to the platform, not to Veer
  *(under $500 / $500–999 / $1,000–2,499 / $2,500–9,999 / $10,000+ / no idea)*
- When someone clicks the ad, what's the one thing you want them to do?
  *(call / book / order online / come to the shop / fill out a form)*
- Run ads before? *(never / boosted a post or two / yes and it worked / yes and it didn't)*

> **Both of these get said before anything is signed, without being asked:**
> 1. The ad budget is paid on their card, to the platform. It never runs through Veer.
> 2. No cost-per-lead or return gets quoted before anything has run. What's promised is
>    that it's built right, watched weekly, and reported honestly.

## 7 · Practical

- Roughly what feels right per month for management? *(under $300 / $300–600 /
  $600–1,000 / $1,000+ / just show me the options)*
- When would you want to start? *(yesterday / this month / next month or two /
  just researching)*
- Anything with a date on it? *(grand opening, a season, an event)*
- Already working with Veer on anything? *(website / Google profile / print / nothing yet)*
- Anything else we should know?

---

## How the answers become a quote

The six starred questions are the whole pricing input. Everything else shapes the work,
not the price.

| Answer | Feeds |
|---|---|
| Platform states — sitting vs. doesn't exist | **Axis A.** Each "sitting" is +$75, each "build it" is +$150; Foundation absorbs the first, preferring a build so the client gets the benefit |
| Number of platforms not marked "not for us" | **Axis B.** Anything beyond the tier's included slots is an extra platform |
| Cadence | **Axis B.** 2/wk → Care, 4/wk → Care Plus, daily → Studio, unsure → Care Plus |
| Locations | **Axis B.** Each beyond the first is +$150/mo |
| Ads yes/no + platforms + budget band | **Axis C.** Setup $250 first platform, +$150 each after; management from the spend table |
| Management budget band | Sanity check — if their band and the derived tier disagree, that's the conversation to have before sending anything |

`intake.html` computes all of this and produces a link that opens the calculator on
`index.html` with the quote already filled in. Paste it, sanity-check the native/mirrored
split, and you have a number.

### Two things the form deliberately cannot decide

- **Native vs mirrored platforms.** The form defaults every overflow platform to mirrored
  (+$50), the cheaper option. Whether a client genuinely needs native content on TikTok
  (+$125) is a judgement call from the conversation, not a checkbox.
- **The tier itself.** Cadence gives a starting point. If someone says "2 a week" but
  their goal is online sales and they want video, Care can't deliver it — that mismatch
  is the sales conversation, and the form's job is to surface it, not resolve it.
