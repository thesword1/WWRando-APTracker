import APConnector from "./ap-connector";
import Permalink from "./permalink";
import SlotDataMapper from "./slot-data-mapper";

jest.mock("archipelago.js", () => {
  const mockDisconnect = jest.fn();
  const mockLogin = jest.fn().mockResolvedValue({ progression_dungeons: 1 });

  return {
    Client: jest.fn().mockImplementation(() => ({
      login: mockLogin,
      room: { seedName: "testSeed" },
      socket: { disconnect: mockDisconnect },
    })),
    __mockLogin: mockLogin,
    __mockDisconnect: mockDisconnect,
  };
});

jest.mock("./slot-data-mapper", () => ({
  mapToOptions: jest.fn().mockReturnValue({
    version: "master",
    seed_name: "testSeed",
    archipelago_link: "",
    archipelago_name: "",
    archipelago_password: "",
  }),
}));

jest.mock("./permalink", () => ({
  OPTIONS: {
    ARCHIPELAGO_LINK: "archipelago_link",
    ARCHIPELAGO_NAME: "archipelago_name",
    ARCHIPELAGO_PASSWORD: "archipelago_password",
  },
  encode: jest.fn().mockReturnValue("encodedPermalink123"),
}));

describe("APConnector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("connect", () => {
    test("returns options and permalink on success", async () => {
      const result = await APConnector.connect(
        "someserver.com:38281",
        "TestPlayer",
        "secret",
      );

      expect(result).toHaveProperty("options");
      expect(result).toHaveProperty("permalink");
      expect(result.permalink).toBe("encodedPermalink123");
    });

    test("calls client.login with correct arguments", async () => {
      const mockLogin = require("archipelago.js").__mockLogin;

      await APConnector.connect("myhost:12345", "MySlot", "mypass");

      expect(mockLogin).toHaveBeenCalledWith(
        "myhost:12345",
        "MySlot",
        "The Wind Waker",
        expect.objectContaining({
          version: { major: 0, minor: 6, build: 6 },
          tags: ["Tracker", "NoText"],
          password: "mypass",
        }),
      );
    });

    test("includes password in login options when provided", async () => {
      const mockLogin = require("archipelago.js").__mockLogin;

      await APConnector.connect("host:1234", "Player", "pass123");

      const loginOptions = mockLogin.mock.calls[0][3];
      expect(loginOptions.password).toBe("pass123");
    });

    test("omits password from login options when empty", async () => {
      const mockLogin = require("archipelago.js").__mockLogin;

      await APConnector.connect("host:1234", "Player", "");

      const loginOptions = mockLogin.mock.calls[0][3];
      expect(loginOptions.password).toBeUndefined();
    });

    test("omits password from login options when null", async () => {
      const mockLogin = require("archipelago.js").__mockLogin;

      await APConnector.connect("host:1234", "Player", null);

      const loginOptions = mockLogin.mock.calls[0][3];
      expect(loginOptions.password).toBeUndefined();
    });

    test("calls SlotDataMapper.mapToOptions with slot data and seedName", async () => {
      await APConnector.connect("host:1234", "Player", "");

      expect(SlotDataMapper.mapToOptions).toHaveBeenCalledWith(
        { progression_dungeons: 1 },
        "testSeed",
      );
    });

    test("uses 'master' when seedName is null", async () => {
      const { Client } = require("archipelago.js");
      Client.mockImplementationOnce(() => ({
        login: jest.fn().mockResolvedValue({}),
        room: { seedName: null },
        socket: { disconnect: jest.fn() },
      }));

      await APConnector.connect("host:1234", "Player", "");

      expect(SlotDataMapper.mapToOptions).toHaveBeenCalledWith({}, "master");
    });

    test("uses 'master' when seedName is undefined", async () => {
      const { Client } = require("archipelago.js");
      Client.mockImplementationOnce(() => ({
        login: jest.fn().mockResolvedValue({}),
        room: {},
        socket: { disconnect: jest.fn() },
      }));

      await APConnector.connect("host:1234", "Player", "");

      expect(SlotDataMapper.mapToOptions).toHaveBeenCalledWith({}, "master");
    });

    test("disconnects client after login", async () => {
      const mockDisconnect = require("archipelago.js").__mockDisconnect;

      await APConnector.connect("host:1234", "Player", "");

      expect(mockDisconnect).toHaveBeenCalled();
    });

    test("sets AP connection info in options", async () => {
      const result = await APConnector.connect(
        "myserver:9999",
        "SeaWordy",
        "pw",
      );

      expect(result.options.archipelago_link).toBe("myserver:9999");
      expect(result.options.archipelago_name).toBe("SeaWordy");
      expect(result.options.archipelago_password).toBe("pw");
    });

    test("sets empty password in options when password is falsy", async () => {
      const result = await APConnector.connect(
        "myserver:9999",
        "SeaWordy",
        null,
      );

      expect(result.options.archipelago_password).toBe("");
    });

    test("calls Permalink.encode with the options", async () => {
      await APConnector.connect("host:1234", "Player", "");

      expect(Permalink.encode).toHaveBeenCalledWith(
        expect.objectContaining({
          archipelago_link: "host:1234",
          archipelago_name: "Player",
          archipelago_password: "",
        }),
      );
    });

    test("propagates login errors", async () => {
      const mockLogin = require("archipelago.js").__mockLogin;
      mockLogin.mockRejectedValueOnce(new Error("Connection refused"));

      await expect(
        APConnector.connect("badhost:1234", "Player", ""),
      ).rejects.toThrow("Connection refused");
    });
  });
});
