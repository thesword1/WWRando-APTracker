# AP Wind Waker Tracker

[![Build and Deploy](https://github.com/thesword1/WWRando-APTracker/actions/workflows/deploy.yml/badge.svg)](https://github.com/thesword1/WWRando-APTracker/actions)

An [Archipelago](https://archipelago.gg/) tracker for [The Wind Waker Randomizer](https://github.com/LagoLunatic/wwrando). It's available at [thesword1.github.io/WWRando-APTracker](https://thesword1.github.io/WWRando-APTracker/).

Based on [wooferzfg's TWW Randomizer Tracker](https://github.com/wooferzfg/tww-rando-tracker).


**Moved From Private Azure DevOps Repo to make use of Github Pages**

## How It Works

### Archipelago Integration

The tracker connects to an [Archipelago](https://archipelago.gg/) multiworld server in real time using the `archipelago.js` client library. When launching the tracker, you provide your AP server URL, slot name, and (optionally) a password. These are encoded into a permalink so sessions can be shared or resumed.

**Connection lifecycle:**

1. The tracker logs in to the AP server with the tags `Tracker` and `NoText` (identifies as a tracker client rather than a game client, and suppresses chat messages).
2. Slot data is received from the server, which contains the randomizer settings and entrance pairings for the session.
3. The AP data package is fetched to enable item/location name lookups by ID.
4. A 30-second health check runs in the background. If the connection drops, it auto-reconnects with exponential backoff (5s, 10s, 20s, up to 60s max).

**Protocol version:** `0.6.6`

### Real-Time Auto-Tracking

The tracker automatically syncs three types of game state from the AP server:

- **Items** — When you receive an item (from any player's world), it's automatically incremented in the tracker. AP item names are mapped to internal tracker names (e.g. `"Bomb Bag Capacity Upgrade"` becomes `"Progressive Bomb Bag"`, individual `"Triforce Shard 1-8"` are consolidated into a single `"Triforce Shard"` counter, and all five Tingle Statues are tracked as one counter).
- **Locations** — When any player checks a location in your world, it's automatically marked in the tracker. Location check messages are rate-limited (150ms between processing) to avoid UI thrashing.
- **Entrances** — When entrance randomization is enabled, the tracker monitors which stages you've visited via AP's DataStorage (`tww_visited_stages_{slot}`). When you enter a new stage, the tracker looks up which exit that stage corresponds to, finds which randomized entrance leads there, and auto-maps the pairing.

On initial connection (and on every reconnect), the tracker performs a full state sync — replaying all received items, checked locations, and hints to rebuild the tracker state from scratch.

### Slot Data Mapping

AP slot data is translated into the tracker's internal settings format.

### Logic Engine

The tracker evaluates location accessibility using the same logic rules as the Wind Waker randomizer. Logic definitions (item requirements, macros) are loaded as YAML and parsed into boolean expression trees that are evaluated against the current tracker state.

Key behaviors:
- **Guaranteed keys** — In non-keylunacy mode, the tracker assumes you'll find dungeon keys naturally. It calculates the minimum guaranteed key count based on which dungeon locations are accessible with your current items.
- **Requirement types** — The engine handles item counts (`"DRC Small Key x3"`), boss defeats (`"Can Reach and Defeat Gohma"`), cross-location requirements (`"Has Accessed Other Location '...'"`) and option checks (`"Option 'randomize_charts' Enabled"`).
- **Memoization** — All logic evaluations are cached and invalidated on state changes for performance.

## Features

### Item Tracking
- Visual grid of all trackable items with click to increment / right-click to decrement
- Items cycle through all valid states (e.g. Progressive Sword: 0 through 4)
- Auto-incremented in real time from the AP server

### Location Tracking
- All locations grouped by zone, color-coded by accessibility:
  - **Blue** — Accessible (logic requirements met)
  - **Red** — Not accessible (missing requirements)
  - **Yellow** — Accessible but non-progress
  - **Purple border** — Hinted by the AP server
  - **Strikethrough** — Checked
- Hover over a location to see its detailed logic requirements, with color-coded items (green = have, red = need)
- Option to show only progress locations or all locations
- Right-click to clear all locations in a zone

### Hint Panel
- Displays hints from the AP server split into two categories:
  - **My Items** — Items for you that are in other players' worlds
  - **Other's Items** — Items for other players that are in your world
- Hints auto-mark as `[Found]` when the corresponding item is received or location is checked

### Sea Chart
- Visual map of The Great Sea divided into sectors
- Click sectors to view location details for each island

### Chart Tracking
- Track treasure chart and triforce chart mappings
- Supports both vanilla and randomized chart modes
- In randomized mode, track "Chart for [Island]" items

### Entrance Randomization
- Toggle an entrance view to map randomized entrances to exits
- Covers dungeons, boss arenas, miniboss arenas, secret caves, fairy fountains, and the Master Sword chamber
- Supports separate or mixed entrance pool modes
- Auto-mapped from in-game stage visits when connected to AP

### Sphere Tracking
- Optional feature to track item progression spheres
- Shows which locations and items belong to each sphere of accessibility

### Statistics
- Total locations: checked / available / remaining
- Filterable to progress-only locations
- Estimated locations left to check

### Settings & Customization
- Toggle logic on/off
- Toggle progress-only filtering
- Customize background colors for UI panels
- Preferences saved to localStorage

### Save & Load
- Tracker state auto-saves to localStorage on every change
- Resume a session via the `/tracker/load/:permalink` route
- Start a new session via `/tracker/new/:permalink`

### Direct Launch via URL

The tracker can be launched directly from a URL using query parameters, bypassing the launcher page entirely. This is useful for embedding links on external sites (e.g. an Archipelago server's room page) that open the tracker and connect automatically.

**URL format:**

```
https://thesword1.github.io/WWRando-APTracker/#/launch?host=<server:port>&slot=<slotName>&password=<password>
```

**Parameters:**

| Parameter  | Required | Description |
|------------|----------|-------------|
| `host`     | Yes      | The AP server address and port (e.g. `archipelago.gg:38281`, `multiworld.gg:87965`) |
| `slot`     | Yes      | Your player/slot name. Special characters are percent-encoded (e.g. `thesword1'sWorld` becomes `thesword1%27sWorld`) |
| `password` | No       | The server password, if one is set. Omit this parameter entirely if no password is needed |

**Examples:**

```
https://thesword1.github.io/WWRando-APTracker/#/launch?host=archipelago.gg:38281&slot=PlayerOne

https://thesword1.github.io/WWRando-APTracker/#/launch?host=fork.gg:87965&slot=thesword1%27sWorld&password=secret
```

When visited, the URL connects to the AP server, fetches the slot data and randomizer settings, then renders the tracker directly in the same tab. A loading spinner is shown during the connection. If the connection fails or required parameters are missing, an error message is displayed with a link back to the launcher.

## Build Instructions

Building and running the tracker locally requires [Node 20](https://nodejs.org/en/download/) and [Git](https://git-scm.com/downloads).

Clone the repository:
```bash
git clone https://github.com/thesword1/WWRando-APTracker.git
```

Navigate to the project folder and install dependencies:
```bash
cd WWRando-APTracker && npm install
```

### Development

Start a local development server:
```bash
npm start
```
Then open [localhost:8080](http://localhost:8080/).

### Testing

Run the test suite:
```bash
npm test
```

### Production Build

Build for production:
```bash
npm run build:production
```
Output is written to the `dist/` directory.

## Known Bugs & Limitations

- **Location parsing for hyphenated island names** — Islands like "Five-Star Isles" and "Two-Eye Reef" require special-case regex handling. If AP changes the format of location messages, these could fail to parse correctly.
- **Hint deduplication** — The hint panel appends hints to a list without checking for duplicates. If the server re-sends hints (e.g. on reconnect via `hintsInitialized`), the same hint can appear multiple times in the panel.
- **Rate-limited message queue is not cleared on reconnect** — If messages were queued before a disconnect, they continue processing after reconnect alongside the fresh state sync, which could cause redundant state updates.
- **Data package timing** — Item and hint events received before the AP data package finishes loading are silently dropped. In most cases the initial state sync on `connected` recovers these, but there is a small window where a hint or item could be missed if it arrives between the data package load and the `connected` event.
- **Auto-reconnect resets entrance tracking** — `processedStages` is reset to an empty Set on reconnect, but `visitedStagesUpdated` re-emits all stages, so entrances are re-evaluated. If the tracker state has been manually modified between disconnect and reconnect, auto-mapped entrances could conflict with manual entries.
- **`parseItem` and `parseSentItem` are unused** — These functions exist in the codebase but are never called, suggesting they are leftover from an earlier message-parsing approach.
- **No offline/PWA sync** — While the build includes a service worker (Workbox), the tracker requires an active AP server connection for auto-tracking. Offline use is limited to manual item/location toggling with no sync on reconnect of manually-made changes.
