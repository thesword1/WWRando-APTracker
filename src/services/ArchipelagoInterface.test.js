import ArchipelagoInterface from "./ArchipelagoInterface";
import Settings from "./settings";
import Permalink from "./permalink";

// Mock archipelago.js Client
jest.mock("archipelago.js", () => {
  const mockOn = jest.fn();
  const mockLogin = jest.fn().mockResolvedValue(undefined);
  const mockFetchPackage = jest.fn().mockResolvedValue(undefined);
  const mockLookupLocationName = jest.fn();
  const mockLookupItemName = jest.fn();

  return {
    Client: jest.fn().mockImplementation(() => ({
      messages: { on: mockOn },
      items: {
        on: mockOn,
        received: [],
        hints: [],
      },
      room: {
        on: mockOn,
        checkedLocations: [],
      },
      socket: { on: mockOn },
      players: {
        self: {
          slot: 1,
          game: "The Wind Waker",
        },
      },
      package: {
        fetchPackage: mockFetchPackage,
        lookupLocationName: mockLookupLocationName,
        lookupItemName: mockLookupItemName,
      },
      login: mockLogin,
      authenticated: true,
    })),
    __mockOn: mockOn,
    __mockLogin: mockLogin,
    __mockFetchPackage: mockFetchPackage,
    __mockLookupLocationName: mockLookupLocationName,
    __mockLookupItemName: mockLookupItemName,
  };
});

// Mock Settings and Permalink
jest.mock("./settings", () => ({
  initializeFromPermalink: jest.fn(),
  initializeRaw: jest.fn(),
  getOptionValue: jest.fn().mockReturnValue("localhost"),
}));

jest.mock("./permalink", () => ({
  OPTIONS: {
    ARCHIPELAGO_LINK: "archipelago_link",
    ARCHIPELAGO_NAME: "archipelago_name",
  },
}));

describe("ArchipelagoInterface", () => {
  let apInterface;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    Settings.getOptionValue.mockImplementation((option) => {
      if (option === "archipelago_link") return "ws://localhost:38281";
      if (option === "archipelago_name") return "TestPlayer";
      return null;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    if (apInterface && apInterface._healthCheckInterval) {
      clearInterval(apInterface._healthCheckInterval);
    }
  });

  describe("constructor", () => {
    test("initializes settings from permalink string", () => {
      apInterface = new ArchipelagoInterface("testPermalink");

      expect(Settings.initializeFromPermalink).toHaveBeenCalledWith(
        "testPermalink",
      );
    });

    test("initializes settings from JSON save data", () => {
      const saveData = JSON.stringify({ settings: { version: "1.0" } });
      apInterface = new ArchipelagoInterface(saveData);

      expect(Settings.initializeRaw).toHaveBeenCalledWith({ version: "1.0" });
    });

    test("reads server URL and slot name from settings", () => {
      apInterface = new ArchipelagoInterface("testPermalink");

      expect(apInterface._serverUrl).toEqual("ws://localhost:38281");
      expect(apInterface._slotName).toEqual("TestPlayer");
    });

    test("registers event listeners on APClient", () => {
      apInterface = new ArchipelagoInterface("testPermalink");

      const mockOn = require("archipelago.js").__mockOn;
      // messages.on, items.on x3, room.on, socket.on = 6 calls
      expect(mockOn).toHaveBeenCalledTimes(6);
    });

    test("logs and continues when initializeFromPermalink throws", () => {
      Settings.initializeFromPermalink.mockImplementationOnce(() => {
        throw new Error("Bad permalink");
      });

      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      apInterface = new ArchipelagoInterface("testPermalink");

      expect(consoleSpy).toHaveBeenCalledWith("Using settings from Save Data");
      consoleSpy.mockRestore();
    });

    test("starts health check interval that calls _checkHealth", () => {
      apInterface = new ArchipelagoInterface("testPermalink");

      expect(apInterface._healthCheckInterval).toBeDefined();

      // Make it so health check would trigger reconnect
      apInterface.APClient.authenticated = false;
      apInterface._reconnecting = false;

      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      jest.advanceTimersByTime(30000);

      // Health check should have fired and triggered reconnect
      expect(apInterface._reconnecting).toEqual(true);

      warnSpy.mockRestore();
    });
  });

  describe("getName", () => {
    test("returns the slot name", () => {
      apInterface = new ArchipelagoInterface("testPermalink");

      expect(apInterface.getName()).toEqual("TestPlayer");
    });
  });

  describe("getPlayerSlot", () => {
    test("returns the player slot from APClient", () => {
      apInterface = new ArchipelagoInterface("testPermalink");

      expect(apInterface.getPlayerSlot()).toEqual(1);
    });
  });

  describe("getPlayerGame", () => {
    test("returns the player game from APClient", () => {
      apInterface = new ArchipelagoInterface("testPermalink");

      expect(apInterface.getPlayerGame()).toEqual("The Wind Waker");
    });

    test("falls back to AP_GAME when player game is undefined", () => {
      apInterface = new ArchipelagoInterface("testPermalink");
      apInterface.APClient.players.self.game = undefined;

      expect(apInterface.getPlayerGame()).toEqual("The Wind Waker");
    });
  });

  describe("getReceivedItems", () => {
    test("returns received items from APClient", () => {
      apInterface = new ArchipelagoInterface("testPermalink");

      expect(apInterface.getReceivedItems()).toEqual([]);
    });
  });

  describe("getHints", () => {
    test("returns hints from APClient", () => {
      apInterface = new ArchipelagoInterface("testPermalink");

      expect(apInterface.getHints()).toEqual([]);
    });
  });

  describe("getCheckedLocationIds", () => {
    test("returns checked location IDs from APClient", () => {
      apInterface = new ArchipelagoInterface("testPermalink");

      expect(apInterface.getCheckedLocationIds()).toEqual([]);
    });
  });

  describe("lookupLocationName", () => {
    test("calls package.lookupLocationName with correct args", () => {
      apInterface = new ArchipelagoInterface("testPermalink");
      const mockLookup = require("archipelago.js").__mockLookupLocationName;
      mockLookup.mockReturnValue("Outset Island - Chest");

      const result = apInterface.lookupLocationName(12345);

      expect(mockLookup).toHaveBeenCalledWith("The Wind Waker", 12345, false);
      expect(result).toEqual("Outset Island - Chest");
    });
  });

  describe("lookupItemName", () => {
    test("calls package.lookupItemName with correct args", () => {
      apInterface = new ArchipelagoInterface("testPermalink");
      const mockLookup = require("archipelago.js").__mockLookupItemName;
      mockLookup.mockReturnValue("Progressive Sword");

      const result = apInterface.lookupItemName(67890);

      expect(mockLookup).toHaveBeenCalledWith("The Wind Waker", 67890, false);
      expect(result).toEqual("Progressive Sword");
    });
  });

  describe("event emitter", () => {
    test("on() registers listeners and emit() calls them", () => {
      apInterface = new ArchipelagoInterface("testPermalink");
      const listener = jest.fn();

      apInterface.on("testEvent", listener);
      apInterface.emit("testEvent", "arg1", "arg2");

      expect(listener).toHaveBeenCalledWith("arg1", "arg2");
    });

    test("emit() does nothing for unregistered events", () => {
      apInterface = new ArchipelagoInterface("testPermalink");

      expect(() => apInterface.emit("unknownEvent")).not.toThrow();
    });

    test("supports multiple listeners for the same event", () => {
      apInterface = new ArchipelagoInterface("testPermalink");
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      apInterface.on("testEvent", listener1);
      apInterface.on("testEvent", listener2);
      apInterface.emit("testEvent", "data");

      expect(listener1).toHaveBeenCalledWith("data");
      expect(listener2).toHaveBeenCalledWith("data");
    });
  });

  describe("_checkHealth", () => {
    test("schedules reconnect when not authenticated", () => {
      apInterface = new ArchipelagoInterface("testPermalink");
      apInterface.APClient.authenticated = false;
      apInterface._reconnecting = false;

      apInterface._checkHealth();

      expect(apInterface._reconnecting).toEqual(true);
    });

    test("does nothing when authenticated", () => {
      apInterface = new ArchipelagoInterface("testPermalink");
      apInterface.APClient.authenticated = true;

      apInterface._checkHealth();

      expect(apInterface._reconnecting).toEqual(false);
    });

    test("does nothing when already reconnecting", () => {
      apInterface = new ArchipelagoInterface("testPermalink");
      apInterface.APClient.authenticated = false;
      apInterface._reconnecting = true;

      apInterface._checkHealth();

      // Should not change state since already reconnecting
      expect(apInterface._reconnecting).toEqual(true);
    });
  });

  describe("_connect", () => {
    test("emits connected event on successful connection", async () => {
      apInterface = new ArchipelagoInterface("testPermalink");
      const listener = jest.fn();
      apInterface.on("connected", listener);

      // _connect is called in constructor, wait for async login + fetchPackage
      await Promise.resolve();
      await Promise.resolve();

      // Advance past the 100ms delay before "connected" is emitted
      jest.advanceTimersByTime(100);
      await Promise.resolve();

      expect(apInterface._connected).toEqual(true);
      expect(listener).toHaveBeenCalled();
    });

    test("logs error on failed connection", async () => {
      const mockLogin = require("archipelago.js").__mockLogin;

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Create instance with successful login first
      apInterface = new ArchipelagoInterface("testPermalink");
      await Promise.resolve();
      await Promise.resolve();

      // Now test _connect directly with a failing login
      mockLogin.mockRejectedValueOnce(new Error("Connection refused"));

      await expect(apInterface._connect()).rejects.toThrow(
        "Connection refused",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to connect:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("_scheduleReconnect", () => {
    test("sets reconnecting flag", () => {
      apInterface = new ArchipelagoInterface("testPermalink");

      apInterface._scheduleReconnect();

      expect(apInterface._reconnecting).toEqual(true);
      expect(apInterface._connected).toEqual(false);
    });

    test("does not schedule if already reconnecting", () => {
      apInterface = new ArchipelagoInterface("testPermalink");
      apInterface._reconnecting = true;

      apInterface._scheduleReconnect();

      // Should not change anything
      expect(apInterface._reconnecting).toEqual(true);
    });

    test("reconnects successfully after timeout", async () => {
      apInterface = new ArchipelagoInterface("testPermalink");
      apInterface._reconnecting = false;
      apInterface._connected = false;

      const listener = jest.fn();
      apInterface.on("connected", listener);

      apInterface._scheduleReconnect();

      // Advance timer to trigger reconnect attempt
      jest.advanceTimersByTime(5000);

      // Let the async login + fetchPackage resolve
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Advance past the 100ms delay before "connected" is emitted
      jest.advanceTimersByTime(100);
      await Promise.resolve();

      expect(apInterface._reconnecting).toEqual(false);
      expect(apInterface._connected).toEqual(true);
    });

    test("retries with exponential backoff on failure", async () => {
      const mockLogin = require("archipelago.js").__mockLogin;

      apInterface = new ArchipelagoInterface("testPermalink");
      // Wait for initial connect
      await Promise.resolve();
      await Promise.resolve();

      // Make login fail for reconnect attempts
      mockLogin.mockRejectedValueOnce(new Error("Connection refused"));

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      apInterface._reconnecting = false;
      apInterface._connected = false;
      apInterface._scheduleReconnect();

      // First attempt at 5s
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Should still be reconnecting after failure
      expect(apInterface._reconnecting).toEqual(true);

      // Retry should be scheduled at 10s (5000 * 2)
      // Make next login succeed
      mockLogin.mockResolvedValueOnce(undefined);
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Advance past the 100ms delay before "connected" is emitted
      jest.advanceTimersByTime(100);
      await Promise.resolve();

      expect(apInterface._reconnecting).toEqual(false);
      expect(apInterface._connected).toEqual(true);

      consoleSpy.mockRestore();
    });
  });

  describe("event forwarding", () => {
    test("forwards message events with sanitized content", async () => {
      const mockOn = require("archipelago.js").__mockOn;

      apInterface = new ArchipelagoInterface("testPermalink");
      const listener = jest.fn();
      apInterface.on("message", listener);

      // Find the messages.on handler (first call to mockOn)
      const messageHandler = mockOn.mock.calls.find(
        (call) => call[0] === "message",
      );
      expect(messageHandler).toBeTruthy();

      // Invoke the handler
      messageHandler[1]("Hello, World, Test,");

      expect(listener).toHaveBeenCalledWith("Hello World Test");
    });

    test("forwards itemsReceived events when data package is loaded", async () => {
      const mockOn = require("archipelago.js").__mockOn;

      apInterface = new ArchipelagoInterface("testPermalink");
      apInterface._dataPackageLoaded = true;
      const listener = jest.fn();
      apInterface.on("itemsReceived", listener);

      const itemsHandler = mockOn.mock.calls.find(
        (call) => call[0] === "itemsReceived",
      );
      expect(itemsHandler).toBeTruthy();

      const mockItems = [{ name: "Sword" }];
      itemsHandler[1](mockItems, 0);

      expect(listener).toHaveBeenCalledWith(mockItems, 0);
    });

    test("suppresses itemsReceived events before data package is loaded", async () => {
      const mockOn = require("archipelago.js").__mockOn;

      apInterface = new ArchipelagoInterface("testPermalink");
      apInterface._dataPackageLoaded = false;
      const listener = jest.fn();
      apInterface.on("itemsReceived", listener);

      const itemsHandler = mockOn.mock.calls.find(
        (call) => call[0] === "itemsReceived",
      );

      itemsHandler[1]([{ name: "Sword" }], 0);

      expect(listener).not.toHaveBeenCalled();
    });

    test("forwards hintsInitialized events when data package is loaded", async () => {
      const mockOn = require("archipelago.js").__mockOn;

      apInterface = new ArchipelagoInterface("testPermalink");
      apInterface._dataPackageLoaded = true;
      const listener = jest.fn();
      apInterface.on("hintsInitialized", listener);

      const hintsHandler = mockOn.mock.calls.find(
        (call) => call[0] === "hintsInitialized",
      );
      expect(hintsHandler).toBeTruthy();

      const mockHints = [{ item: { name: "Sword" }, found: false }];
      hintsHandler[1](mockHints);

      expect(listener).toHaveBeenCalledWith(mockHints);
    });

    test("suppresses hintsInitialized events before data package is loaded", async () => {
      const mockOn = require("archipelago.js").__mockOn;

      apInterface = new ArchipelagoInterface("testPermalink");
      apInterface._dataPackageLoaded = false;
      const listener = jest.fn();
      apInterface.on("hintsInitialized", listener);

      const hintsHandler = mockOn.mock.calls.find(
        (call) => call[0] === "hintsInitialized",
      );

      hintsHandler[1]([{ item: { name: "Sword" }, found: false }]);

      expect(listener).not.toHaveBeenCalled();
    });

    test("forwards hintReceived events", async () => {
      const mockOn = require("archipelago.js").__mockOn;

      apInterface = new ArchipelagoInterface("testPermalink");
      const listener = jest.fn();
      apInterface.on("hintReceived", listener);

      const hintHandler = mockOn.mock.calls.find(
        (call) => call[0] === "hintReceived",
      );
      expect(hintHandler).toBeTruthy();

      const mockHint = { item: { name: "Sword" }, found: false };
      hintHandler[1](mockHint);

      expect(listener).toHaveBeenCalledWith(mockHint);
    });

    test("forwards locationsChecked events only when connected", async () => {
      const mockOn = require("archipelago.js").__mockOn;

      apInterface = new ArchipelagoInterface("testPermalink");
      await Promise.resolve();
      await Promise.resolve();

      const listener = jest.fn();
      apInterface.on("locationsChecked", listener);

      const locHandler = mockOn.mock.calls.find(
        (call) => call[0] === "locationsChecked",
      );
      expect(locHandler).toBeTruthy();

      // When connected, should forward
      apInterface._connected = true;
      locHandler[1]([101, 102]);
      expect(listener).toHaveBeenCalledWith([101, 102]);

      // When disconnected, should not forward
      listener.mockClear();
      apInterface._connected = false;
      locHandler[1]([103]);
      expect(listener).not.toHaveBeenCalled();
    });

    test("handles disconnect event and schedules reconnect", async () => {
      const mockOn = require("archipelago.js").__mockOn;

      apInterface = new ArchipelagoInterface("testPermalink");
      await Promise.resolve();
      await Promise.resolve();

      const disconnectHandler = mockOn.mock.calls.find(
        (call) => call[0] === "disconnected",
      );
      expect(disconnectHandler).toBeTruthy();

      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      apInterface._connected = true;
      apInterface._reconnecting = false;
      disconnectHandler[1]();

      expect(apInterface._connected).toEqual(false);
      expect(apInterface._reconnecting).toEqual(true);

      warnSpy.mockRestore();
    });
  });
});
