# Life Priorities

A mobile-first personal priorities assessment for adults who want a clearer picture of what matters, where attention is going, and what should change next.

## Public app

Once GitHub Pages is enabled for this repository using GitHub Actions, the production app is published at:

`https://mbguitars86.github.io/audit1/`

Every push to `main` automatically rebuilds and redeploys the app through `.github/workflows/deploy-pages.yml`.

## Current product

- 24 questions across 8 life categories
- 1–10 ratings for importance, current attention, and satisfaction
- Priority-gap analysis: importance minus attention
- 0–100 action-priority score
- Priority Balance and Average Satisfaction summaries
- Top 3 action priorities with category-specific recommendations
- 30-day action plan with progress status
- Save completed assessments on the device
- Previous Assessment history
- Compare any two saved assessments over time
- Download a self-contained PDF report without an external PDF library
- Print-friendly results and comparison views
- Draft progress saved in browser local storage
- Resume at the first unanswered question

## Categories

Health, Wealth, Family & Relationships, Career & Goals, Lifestyle & Time, Purpose & Legacy, Needs, and Wants.

## Scoring model

For each category:

- `gap = importance - attention`
- Underinvested: gap of `+3` or more
- Overinvested: gap of `-3` or less
- Needs attention: importance of at least `7` and satisfaction of `4` or less, when not already classified as underinvested
- Action Priority = 50% importance + 30% positive gap + 20% dissatisfaction, scaled to 0–100

The action-priority score is not a statement of personal worth or objective importance. It is a decision aid for identifying where deliberate action may have the highest value.

## Data and privacy

The MVP has no account system or remote database. Draft answers and saved assessments remain in the browser's local storage unless the user downloads, prints, shares, or clears them.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deployment

Production deployment uses GitHub Pages and GitHub Actions.

- Vite is configured with the `/audit1/` base path.
- The deployment workflow installs dependencies, runs the production build, uploads `dist`, and deploys it to GitHub Pages.
- Repository Settings → Pages must use **GitHub Actions** as the build and deployment source.

## Manual test checklist

1. Complete all 24 questions.
2. Confirm the result screen renders Priority Balance, Average Satisfaction, Top 3 priorities, gaps, recommendations, and the 30-day plan.
3. Change 30-day plan statuses and save the assessment.
4. Return to Home and open Previous Assessments.
5. Open the saved assessment and confirm its values remain intact.
6. Complete and save a second assessment, then compare the two.
7. Download the PDF report and confirm it opens correctly.
8. Test Print Results.
9. Start a new assessment, leave midway, reload, and confirm Continue Assessment resumes correctly.
10. Open the public GitHub Pages URL on a separate device and verify the assessment loads without a GitHub login.

## Product validation

See `PRODUCT_VALIDATION_PLAN.md` for the first structured user-testing round.
