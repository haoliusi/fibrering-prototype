# FibreRing

A gentle, interactive prototype for building everyday fiber habits. Plain HTML, CSS and JavaScript, with no build step and no dependencies.

## Run it

Open `dist/index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 4173 --directory dist
```

Then visit http://localhost:4173.

## Flow

**Onboarding (once):** Check-in (pick staples) -> Swaps (build a meal plan) -> Habit (if-then plan and reminder) -> notification preview.

**After setup:** bottom navigation with **Today**, **Progress** and **Preferences**. Preferences summarizes your setup choices and lets you edit each section.

The daily goal is +15 g of added fiber. State is saved in `localStorage` under `fibrering-v1`. Use **Restart** on the Progress tab to clear it.

## Files

- `dist/index.html`: page shell and phone frame
- `dist/styles.css`: styles
- `dist/app.js`: state, rendering and event handling

Fiber estimates come from USDA, USDA/HHS and VA reference tables (linked in the app). Values vary by brand and preparation.
