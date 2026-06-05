# 🧘 ZenFocus Station

ZenFocus Station is a state-of-the-art, premium productivity dashboard. It is engineered with a gorgeous glassmorphic aesthetic, custom dynamic gradient overlays, focus sessions statistics analytics, and synthesizer background soundscapes.

## Features

- **Circular Progress Timer**: Highly customizable timers for Focus, Short Breaks, and Long Breaks.
- **Glassmorphic Layout**: Harmonious HSL colors and blur backdrops matching a modern dark profile aesthetic.
- **Synthesized Ambient Sounds**: Fully browser-generated audio feeds (Rain, White Noise, and **Forest Wind Chimes**) built using the Web Audio API without any external dependencies.
- **Interactive Focus Objectives**: Set a list of priorities, mark them complete, and automatically link the active focus task to your productivity logs.
- **Custom Duration Setting Drawer**: Change default session times (1m to 180m) on-the-fly.
- **Dynamic Themes**: Instant toggle between:
  - 🌌 **Aurora** (Neon indigo & purple)
  - 🌅 **Sunset** (Rosy orange & red aura)
  - 🌲 **Forest** (Emerald & teal mist)
- **Analytics Dashboard**: Interactive logging of streak counts, sessions totals, and cumulative session durations.

## Keyboard Controls

- `Spacebar`: Play / Pause the focus countdown.
- `Escape`: Reset the active session timer.

## Development & Usage

1. Open `index.html` directly in any web browser.
2. Turn on the focus session, select themes, adjust ambient slider volumes, and track your work progress.

## How to push to GitHub

To link this local workspace with your remote GitHub repository and register these commits on your contribution graph:

1. Create a **new, empty repository** on GitHub. Do not initialize it with a README, license, or gitignore.
2. Copy the Git remote URL (e.g. `https://github.com/YOUR-USERNAME/YOUR-REPO.git`).
3. Run the following commands in your shell within this folder:
   ```powershell
   # Add your remote link
   git remote add origin <your-github-repo-url>

   # Rename branch to main
   git branch -M main

   # Push your code (this will upload all 5 commits as contributions)
   git push -u origin main
   ```
