import { Client } from "archipelago.js";
import Settings from "./settings";
import Permalink from "./permalink";

const AP_VERSION = { major: 0, minor: 6, build: 6 };
const AP_GAME = "The Wind Waker";

class ArchipelagoInterface {
  constructor(param) {
    try {
      Settings.initializeFromPermalink(param);
    } catch {
      console.log("Using settings from Save Data");
    }
    try {
      const { settings } = JSON.parse(param);
      Settings.initializeRaw(settings);
    } catch {
      console.log("Using settings from Permalink");
    }

    this.APClient = new Client();
    this.events = {};
    this._reconnecting = false;
    this._connected = false;
    this._dataPackageLoaded = false;
    this._serverUrl = Settings.getOptionValue(
      Permalink.OPTIONS.ARCHIPELAGO_LINK,
    );
    this._slotName = Settings.getOptionValue(
      Permalink.OPTIONS.ARCHIPELAGO_NAME,
    );
    this._password =
      Settings.getOptionValue(Permalink.OPTIONS.ARCHIPELAGO_PASSWORD) || "";

    this.APClient.messages.on("message", (content) => {
      const sanitizedContent = content.replace(/,/g, "");
      this.emit("message", sanitizedContent);
    });

    // Forward item events (only after data package is loaded so item.name resolves)
    this.APClient.items.on("itemsReceived", (items, startingIndex) => {
      if (this._dataPackageLoaded) {
        this.emit("itemsReceived", items, startingIndex);
      }
    });

    // Forward hint events
    this.APClient.items.on("hintsInitialized", (hints) => {
      if (this._dataPackageLoaded) {
        this.emit("hintsInitialized", hints);
      }
    });

    this.APClient.items.on("hintReceived", (hint) => {
      this.emit("hintReceived", hint);
    });

    // Forward location check events
    this.APClient.room.on("locationsChecked", (locationIds) => {
      if (this._connected) {
        this.emit("locationsChecked", locationIds);
      }
    });

    // Listen for disconnects and auto-reconnect
    this.APClient.socket.on("disconnected", () => {
      console.warn("Disconnected from Archipelago server.");
      this._connected = false;
      this._scheduleReconnect();
    });

    this._connect();

    // Health check: periodically verify the connection is alive
    this._healthCheckInterval = setInterval(() => {
      this._checkHealth();
    }, 30000);
  }

  async _connect() {
    try {
      await this.APClient.login(this._serverUrl, this._slotName, AP_GAME, {
        version: AP_VERSION,
        password: this._password,
      });
      console.log("Connected to the Archipelago server!");

      // Fetch data package for name lookups
      await this.APClient.package.fetchPackage();
      console.log("Data package loaded.");
      this._dataPackageLoaded = true;

      // Wait one tick so any pending ReceivedItems packets from the server
      // are processed before we emit "connected" for initial state sync.
      await new Promise((resolve) => setTimeout(resolve, 100));

      this._connected = true;
      this.emit("connected");
    } catch (err) {
      console.error("Failed to connect:", err);
      throw err;
    }
  }

  getName() {
    return this._slotName;
  }

  getPlayerSlot() {
    return this.APClient.players.self?.slot;
  }

  getPlayerGame() {
    return this.APClient.players.self?.game || AP_GAME;
  }

  getReceivedItems() {
    return this.APClient.items.received;
  }

  getHints() {
    return this.APClient.items.hints;
  }

  getCheckedLocationIds() {
    return this.APClient.room.checkedLocations;
  }

  lookupLocationName(locationId) {
    return this.APClient.package.lookupLocationName(
      this.getPlayerGame(),
      locationId,
      false,
    );
  }

  lookupItemName(itemId) {
    return this.APClient.package.lookupItemName(
      this.getPlayerGame(),
      itemId,
      false,
    );
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach((listener) => listener(...args));
    }
  }

  _checkHealth() {
    if (!this.APClient.authenticated && !this._reconnecting) {
      console.warn("Health check: connection lost. Attempting reconnect...");
      this._scheduleReconnect();
    }
  }

  _scheduleReconnect() {
    if (this._reconnecting) return;
    this._reconnecting = true;
    this._connected = false;

    const attempt = (retryDelay) => {
      console.log(`Reconnecting to Archipelago in ${retryDelay / 1000}s...`);
      setTimeout(async () => {
        try {
          await this.APClient.login(this._serverUrl, this._slotName, AP_GAME, {
            version: AP_VERSION,
            password: this._password,
          });
          console.log("Reconnected to the Archipelago server!");
          await this.APClient.package.fetchPackage();
          this._dataPackageLoaded = true;
          await new Promise((resolve) => setTimeout(resolve, 100));
          this._reconnecting = false;
          this._connected = true;
          this.emit("connected");
        } catch (err) {
          console.error("Reconnect failed:", err);
          const nextDelay = Math.min(retryDelay * 2, 60000);
          attempt(nextDelay);
        }
      }, retryDelay);
    };

    attempt(5000);
  }
}

export default ArchipelagoInterface;
