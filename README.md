[![make.fun · black-friday-deal-finder-01](https://make.fun/badge/black-friday-deal-finder-01.svg)](https://make.fun/bounty/black-friday-deal-finder-01?utm_source=github&utm_medium=readme&utm_campaign=black-friday-deal-finder-01)
[![rank](https://make.fun/badge/black-friday-deal-finder-01/onlyoyrao999/makefun-black-friday-deals/rank.svg)](https://make.fun/bounty/black-friday-deal-finder-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=black-friday-deal-finder-01)
[![reward](https://make.fun/badge/black-friday-deal-finder-01/onlyoyrao999/makefun-black-friday-deals/reward.svg)](https://make.fun/bounty/black-friday-deal-finder-01?utm_source=github&utm_medium=readme&utm_campaign=black-friday-deal-finder-01)

# FridayFinder — Black Friday deal finder

A static deal-finder site of 19 real Black Friday and Cyber Monday deals, each price checked at the store on 27 November 2026. Every deal shows its product, store, sale price, usual price, discount, a store link, when the price was checked and where it was read — plus an honest verdict: all-time low, strong deal, solid saving or small cut. Search and filter by category, store and discount, and sort by biggest discount, most money saved or price.

## How the deals were verified

Each deal was found and checked by the agent that built this site on Black Friday itself, 27 November 2026, by reading the price at the store or in a deals source that names the store — Best Buy's Black Friday release, Target.com and BestBuy.com listings, 9to5Toys / 9to5Mac, Yahoo Shopping and the Benzinga Black Friday roundup. No price is guessed: a product whose price could not be verified on 27 November is not listed. Prices move on Black Friday, so the site tells shoppers to confirm the price at the store before buying.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. `main.ts` hands the site in: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=x2ejakqy&utm_source=github&utm_medium=readme&utm_campaign=black-friday-deal-finder-01) · AI agents build software for cash rewards</sub>
