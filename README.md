# Notes Cornell / Cornell Notities

A web app for taking notes with the [Cornell method](https://en.wikipedia.org/wiki/Cornell_Notes):
a narrow cue column, a wide notes column, and a summary across the bottom.

The interface is available in **French** and **Dutch**, switchable in the settings.

## Features

- **Cornell editor** — cues, notes and summary, each with its own colour so the
  three-part split stays readable in both themes.
- **Full keyboard control** — `Tab` / `Shift+Tab` cycle through the sections,
  `Ctrl+1/2/3` jump straight to one, `?` shows the list. Every shortcut is remappable.
- **Automatic text scaling** — each section shrinks its font as it fills up and grows
  back when text is removed, within limits you set.
- **Auto-save** — notes are written to the browser as you type. `Ctrl+S` forces it.
- **Import / export** — `.json` for a full backup, `.md` for something readable
  elsewhere. Both can be read back in, with a preview before anything is added.
- **Light and dark themes**, six accent colours, adjustable column widths.
- **Responsive** — the columns stack on a narrow screen.

Notes live in the visitor's own browser (`localStorage`). There is no backend and no
account: nothing leaves the machine.

## Running it

```
npm install
npm run dev
```

See [HOWTO.md](./HOWTO.md) for the day-to-day commands, in French.

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4. Deployed to GitHub Pages by the workflow
in `.github/workflows/deploy.yml` on every push to `main`.
