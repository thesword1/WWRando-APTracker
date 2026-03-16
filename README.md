# AP Wind Waker Tracker

[![Build and Deploy](https://github.com/thesword1/AP-WWTracker/actions/workflows/deploy.yml/badge.svg)](https://github.com/thesword1/AP-WWTracker/actions)

An [Archipelago](https://archipelago.gg/) tracker for [The Wind Waker Randomizer](https://github.com/LagoLunatic/wwrando). It's available at [thesword1.github.io/AP-WWTracker](https://thesword1.github.io/AP-WWTracker/).

Based on [wooferzfg's TWW Randomizer Tracker](https://github.com/wooferzfg/tww-rando-tracker).

## Build Instructions

Building and running the tracker locally requires [Node 20](https://nodejs.org/en/download/) and [Git](https://git-scm.com/downloads).

Clone the repository:
```bash
git clone https://github.com/thesword1/AP-WWTracker.git
```

Navigate to the project folder and install dependencies:
```bash
cd AP-WWTracker && npm install
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
