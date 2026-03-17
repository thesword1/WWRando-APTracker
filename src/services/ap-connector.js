import _ from "lodash";
import { Client } from "archipelago.js";

import Permalink from "./permalink";
import SlotDataMapper from "./slot-data-mapper";

const AP_VERSION = { major: 0, minor: 6, build: 6 };
const AP_GAME = "The Wind Waker";
const AP_TAGS = ["Tracker", "NoText"];

class APConnector {
  static async connect(serverLink, playerName, password) {
    const client = new Client();
    const loginOptions = {
      version: AP_VERSION,
      tags: AP_TAGS,
    };
    if (password) {
      loginOptions.password = password;
    }

    const slotData = await client.login(
      serverLink,
      playerName,
      AP_GAME,
      loginOptions,
    );

    const seedName = client.room.seedName || "master";
    client.socket.disconnect();

    const options = SlotDataMapper.mapToOptions(slotData, seedName);
    _.set(options, Permalink.OPTIONS.ARCHIPELAGO_LINK, serverLink);
    _.set(options, Permalink.OPTIONS.ARCHIPELAGO_NAME, playerName);
    _.set(options, Permalink.OPTIONS.ARCHIPELAGO_PASSWORD, password || "");

    const permalink = Permalink.encode(options);
    return { options, permalink };
  }
}

export default APConnector;
