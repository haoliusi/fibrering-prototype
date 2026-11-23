# FibreRing

A gentle, interactive prototype for building everyday fiber habits. Plain HTML, CSS and JavaScript, with no build step and no dependencies.

## Run it

Open `dist/index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 4173 --directory dist
```

Then visit http://localhost:4173.

## Flow

**Onboarding (once):** Check-in (browse staples by category and tap to add, then review times per week for each in "Your staples" at the end) -> Swaps (3 curated options per staple, "See more" for the rest, or add your own swap with its fiber; add swaps to the meal plan and the shopping list) -> Habit (if-then plan and reminder) -> notification preview.

**After setup:** bottom navigation with **Today**, **Progress**, **Shopping** and **Preferences**. Shopping lists swap and habit items with amounts for one week (servings = times per week; habit = daily portion x 7). Preferences summarizes your setup choices and lets you edit each section.

The daily goal is +15 g of added fiber. State is saved in `localStorage` under `fibrering-v1`. Use **Restart** on the Progress tab to clear it.

## Staples and swaps

The staples catalog (`STAPLES`, grouped by `CATS`) and each staple's swap options with fiber per portion (`SWAPS`) are at the top of `dist/app.js`. Times per week is stored per staple and is shown for context; fiber estimates assume one swap a day. Options are in curated order: the first 3 are the closest match to the staple that still add fiber. Options listed under `examples` are brand-dependent product values. Swaps people add themselves need a fiber value (and, for their own staples, the usual staple's fiber) so they count toward progress, and can be removed with the × next to them.

## Files

- `dist/index.html`: page shell and phone frame
- `dist/styles.css`: styles
- `dist/app.js`: state, rendering and event handling

Fiber estimates come from USDA, USDA/HHS and VA reference tables (linked in the app). Values vary by brand and preparation.
