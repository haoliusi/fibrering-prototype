# FibreRing

FibreRing is a browser prototype for planning food swaps, adding a fiber habit, and tracking added fiber against a +15 g daily goal.

## Run locally

Download this repository as a ZIP or clone it. Open `dist/index.html` in a browser, or serve it locally with Python:

```sh
python3 -m http.server 4173 --directory dist
```

Then open `http://localhost:4173`.

## How it works

1. Select staples and set up swaps. The plan estimates the extra fiber if each listed swap is completed once today.
2. Choose a meal, a habit food, and a cooked portion in cups. Save the habit to see the notification preview.
3. Mark completed swaps and the habit on Today. The progress ring counts the added fiber from those entries.

The app uses browser storage. The notification is a preview. Fiber amounts are estimates based on the reference foods and portions linked in the app.
