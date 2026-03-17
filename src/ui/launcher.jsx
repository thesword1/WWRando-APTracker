import _ from "lodash";
import React from "react";
import { ToastContainer, toast } from "react-toastify";

import { Client } from "archipelago.js";

import HEADER_IMAGE from "../images/header.png";
import Permalink from "../services/permalink";
import SlotDataMapper from "../services/slot-data-mapper";

import DropdownOptionInput from "./dropdown-option-input";
import TextBoxOptionInput from "./textbox-option-input";
import OptionsTable from "./options-table";
import Storage from "./storage";
import ToggleOptionInput from "./toggle-option-input";

import "react-toastify/dist/ReactToastify.css";
import "react-toggle/style.css";

export default class Launcher extends React.PureComponent {
  static notifyAboutUpdate() {
    const { serviceWorker } = navigator;
    if (_.isNil(serviceWorker) || _.isNil(serviceWorker.controller)) {
      // Don't prompt for update when service worker gets removed
      return;
    }

    toast.warn(
      "A new version of the tracker is available! Click here to reload.",
      {
        autoClose: false,
        closeOnClick: true,
        onClick: () => window.location.reload(),
      },
    );
  }

  static openTrackerWindow(route) {
    const windowWidth = 1797;
    const windowHeight = 585;

    window.open(
      `#/tracker${route}`,
      "_blank",
      `width=${windowWidth},height=${windowHeight},titlebar=0,menubar=0,toolbar=0`,
    );
  }

  constructor() {
    super();

    const permalink = Permalink.DEFAULT_PERMALINK;
    const options = Permalink.decode(permalink);

    this.state = {
      options,
      permalink,
    };

    this.connectAndLaunch = this.connectAndLaunch.bind(this);
    this.launchNewTracker = this.launchNewTracker.bind(this);
    this.loadFromFile = this.loadFromFile.bind(this);
    this.loadFromSave = this.loadFromSave.bind(this);
    this.setOptionValue = this.setOptionValue.bind(this);
  }

  componentDidMount() {
    const { serviceWorker } = navigator;

    if (!_.isNil(serviceWorker) && !_.isNil(serviceWorker.controller)) {
      // Don't prompt for update when there was no service worker previously installed
      serviceWorker.addEventListener(
        "controllerchange",
        Launcher.notifyAboutUpdate,
      );
    }
  }

  componentWillUnmount() {
    const { serviceWorker } = navigator;

    if (!_.isNil(serviceWorker)) {
      serviceWorker.removeEventListener(
        "controllerchange",
        Launcher.notifyAboutUpdate,
      );
    }
  }

  getOptionValue(optionName) {
    const { options } = this.state;

    return _.get(options, optionName);
  }

  setOptionValue(optionName, newValue) {
    const { options } = this.state;

    _.set(options, optionName, newValue);

    this.updateOptions(options);
  }

  loadPermalink(permalinkInput) {
    try {
      const options = Permalink.decode(permalinkInput);

      this.updateOptions(options);
    } catch (err) {
      toast.error("Invalid permalink!");
    }
  }

  updateOptions(options) {
    const permalink = Permalink.encode(options);

    this.setState({
      options,
      permalink,
    });
  }

  toggleInput({ labelText, optionName }) {
    const optionValue = this.getOptionValue(optionName);

    return (
      <ToggleOptionInput
        key={optionName}
        labelText={labelText}
        optionName={optionName}
        optionValue={optionValue}
        setOptionValue={this.setOptionValue}
      />
    );
  }

  dropdownInput({ labelText, optionName, isDisabled = false }) {
    const optionValue = this.getOptionValue(optionName);

    return (
      <DropdownOptionInput
        key={optionName}
        labelText={labelText}
        optionName={optionName}
        optionValue={optionValue}
        setOptionValue={this.setOptionValue}
        isDisabled={isDisabled}
      />
    );
  }

  textInput({
    labelText,
    optionName,
    isDisabled = false,
    inputType,
    placeholder,
  }) {
    const optionValue = this.getOptionValue(optionName);

    return (
      <TextBoxOptionInput
        key={optionName}
        labelText={labelText}
        optionName={optionName}
        optionValue={optionValue}
        setOptionValue={this.setOptionValue}
        isDisabled={isDisabled}
        inputType={inputType}
        placeholder={placeholder}
      />
    );
  }

  permalinkContainer() {
    const { permalink } = this.state;

    return (
      <div className="permalink-container">
        <div className="permalink-label">Permalink:</div>
        <div className="permalink-input">
          <input
            placeholder="Permalink"
            className="permalink"
            onChange={(event) => this.loadPermalink(event.target.value)}
            value={permalink}
          />
        </div>
      </div>
    );
  }

  progressItemLocationsTable() {
    return (
      <OptionsTable
        title="Progress Item Locations"
        numColumns={3}
        options={[
          this.toggleInput({
            labelText: "Dungeons",
            optionName: Permalink.OPTIONS.PROGRESSION_DUNGEONS,
          }),
          this.toggleInput({
            labelText: "Puzzle Secret Caves",
            optionName: Permalink.OPTIONS.PROGRESSION_PUZZLE_SECRET_CAVES,
          }),
          this.toggleInput({
            labelText: "Combat Secret Caves",
            optionName: Permalink.OPTIONS.PROGRESSION_COMBAT_SECRET_CAVES,
          }),
          this.toggleInput({
            labelText: "Savage Labyrinth",
            optionName: Permalink.OPTIONS.PROGRESSION_SAVAGE_LABYRINTH,
          }),
          this.toggleInput({
            labelText: "Island Puzzles",
            optionName: Permalink.OPTIONS.PROGRESSION_ISLAND_PUZZLES,
          }),
          this.toggleInput({
            labelText: "Dungeon Secrets",
            optionName: Permalink.OPTIONS.PROGRESSION_DUNGEON_SECRETS,
          }),
          this.toggleInput({
            labelText: "Tingle Chests",
            optionName: Permalink.OPTIONS.PROGRESSION_TINGLE_CHESTS,
          }),
          this.toggleInput({
            labelText: "Great Fairies",
            optionName: Permalink.OPTIONS.PROGRESSION_GREAT_FAIRIES,
          }),
          this.toggleInput({
            labelText: "Submarines",
            optionName: Permalink.OPTIONS.PROGRESSION_SUBMARINES,
          }),
          this.toggleInput({
            labelText: "Lookout Platforms and Rafts",
            optionName: Permalink.OPTIONS.PROGRESSION_PLATFORMS_RAFTS,
          }),
          this.toggleInput({
            labelText: "Short Sidequests",
            optionName: Permalink.OPTIONS.PROGRESSION_SHORT_SIDEQUESTS,
          }),
          this.toggleInput({
            labelText: "Long Sidequests",
            optionName: Permalink.OPTIONS.PROGRESSION_LONG_SIDEQUESTS,
          }),
          this.toggleInput({
            labelText: "Spoils Trading",
            optionName: Permalink.OPTIONS.PROGRESSION_SPOILS_TRADING,
          }),
          this.toggleInput({
            labelText: "Eye Reef Chests",
            optionName: Permalink.OPTIONS.PROGRESSION_EYE_REEF_CHESTS,
          }),
          this.toggleInput({
            labelText: "Big Octos and Gunboats",
            optionName: Permalink.OPTIONS.PROGRESSION_BIG_OCTOS_GUNBOATS,
          }),
          this.toggleInput({
            labelText: "Miscellaneous",
            optionName: Permalink.OPTIONS.PROGRESSION_MISC,
          }),
          this.toggleInput({
            labelText: "Minigames",
            optionName: Permalink.OPTIONS.PROGRESSION_MINIGAMES,
          }),
          this.toggleInput({
            labelText: "Battlesquid Minigame",
            optionName: Permalink.OPTIONS.PROGRESSION_BATTLESQUID,
          }),
          this.toggleInput({
            labelText: "Free Gifts",
            optionName: Permalink.OPTIONS.PROGRESSION_FREE_GIFTS,
          }),
          this.toggleInput({
            labelText: "Mail",
            optionName: Permalink.OPTIONS.PROGRESSION_MAIL,
          }),
          this.toggleInput({
            labelText: "Expensive Purchases",
            optionName: Permalink.OPTIONS.PROGRESSION_EXPENSIVE_PURCHASES,
          }),
          this.toggleInput({
            labelText: "Sunken Treasure (From Triforce Charts)",
            optionName: Permalink.OPTIONS.PROGRESSION_TRIFORCE_CHARTS,
          }),
          this.toggleInput({
            labelText: "Sunken Treasure (From Treasure Charts)",
            optionName: Permalink.OPTIONS.PROGRESSION_TREASURE_CHARTS,
          }),
        ]}
      />
    );
  }

  entranceRandomizerOptionsTable() {
    return (
      <OptionsTable
        title="Entrance Randomizer Options"
        numColumns={2}
        options={[
          this.toggleInput({
            labelText: "Dungeons",
            optionName: Permalink.OPTIONS.RANDOMIZE_DUNGEON_ENTRANCES,
          }),
          this.toggleInput({
            labelText: "Nested Bosses",
            optionName: Permalink.OPTIONS.RANDOMIZE_BOSS_ENTRANCES,
          }),
          this.toggleInput({
            labelText: "Nested Minibosses",
            optionName: Permalink.OPTIONS.RANDOMIZE_MINIBOSS_ENTRANCES,
          }),
          this.toggleInput({
            labelText: "Secret Caves",
            optionName: Permalink.OPTIONS.RANDOMIZE_SECRET_CAVE_ENTRANCES,
          }),
          this.toggleInput({
            labelText: "Inner Secret Caves",
            optionName: Permalink.OPTIONS.RANDOMIZE_SECRET_CAVE_INNER_ENTRANCES,
          }),
          this.toggleInput({
            labelText: "Fairy Fountains",
            optionName: Permalink.OPTIONS.RANDOMIZE_FAIRY_FOUNTAIN_ENTRANCES,
          }),
          this.dropdownInput({
            labelText: "Mixing",
            optionName: Permalink.OPTIONS.MIX_ENTRANCES,
            isDisabled:
              (!this.getOptionValue(
                Permalink.OPTIONS.RANDOMIZE_DUNGEON_ENTRANCES,
              ) &&
                !this.getOptionValue(
                  Permalink.OPTIONS.RANDOMIZE_BOSS_ENTRANCES,
                ) &&
                !this.getOptionValue(
                  Permalink.OPTIONS.RANDOMIZE_MINIBOSS_ENTRANCES,
                )) ||
              (!this.getOptionValue(
                Permalink.OPTIONS.RANDOMIZE_SECRET_CAVE_ENTRANCES,
              ) &&
                !this.getOptionValue(
                  Permalink.OPTIONS.RANDOMIZE_SECRET_CAVE_INNER_ENTRANCES,
                ) &&
                !this.getOptionValue(
                  Permalink.OPTIONS.RANDOMIZE_FAIRY_FOUNTAIN_ENTRANCES,
                )),
          }),
        ]}
      />
    );
  }

  additionalOptionsTable() {
    return (
      <OptionsTable
        title="Additional Options"
        numColumns={2}
        options={[
          this.dropdownInput({
            labelText: "Sword Mode",
            optionName: Permalink.OPTIONS.SWORD_MODE,
          }),
          this.toggleInput({
            labelText: "Small Key Lunacy",
            optionName: Permalink.OPTIONS.SMALL_KEYLUNACY,
          }),
          this.toggleInput({
            labelText: "Big Key Lunacy",
            optionName: Permalink.OPTIONS.BIG_KEYLUNACY,
          }),
          this.dropdownInput({
            labelText: "Triforce Shards to Start With",
            optionName: Permalink.OPTIONS.NUM_STARTING_TRIFORCE_SHARDS,
          }),
          this.toggleInput({
            labelText: "Randomize Charts",
            optionName: Permalink.OPTIONS.RANDOMIZE_CHARTS,
          }),
          this.toggleInput({
            labelText: "Required Bosses Mode",
            optionName: Permalink.OPTIONS.REQUIRED_BOSSES,
          }),
          this.dropdownInput({
            labelText: "Number of Required Bosses",
            optionName: Permalink.OPTIONS.NUM_REQUIRED_BOSSES,
            isDisabled: !this.getOptionValue(Permalink.OPTIONS.REQUIRED_BOSSES),
          }),
          this.toggleInput({
            labelText: "Skip Boss Rematches",
            optionName: Permalink.OPTIONS.SKIP_REMATCH_BOSSES,
          }),
        ]}
      />
    );
  }

  logicDifficultyTable() {
    return (
      <OptionsTable
        title="Logic Difficulty"
        numColumns={2}
        options={[
          this.dropdownInput({
            labelText: "Obscure Tricks Required",
            optionName: Permalink.OPTIONS.LOGIC_OBSCURITY,
          }),
          this.dropdownInput({
            labelText: "Precise Tricks Required",
            optionName: Permalink.OPTIONS.LOGIC_PRECISION,
          }),
        ]}
      />
    );
  }

  archipelagoOptionsTable() {
    return (
      <OptionsTable
        title="Archipelago Options"
        numColumns={1}
        options={[
          this.textInput({
            labelText: "Archipelago Server Link",
            optionName: Permalink.OPTIONS.ARCHIPELAGO_LINK,
            placeholder: "archipelago.gg:00000",
          }),
          this.textInput({
            labelText: "Archipelago Player Name",
            optionName: Permalink.OPTIONS.ARCHIPELAGO_NAME,
            placeholder: "Slot Name",
          }),
          this.textInput({
            labelText: "Archipelago Password (optional)",
            optionName: Permalink.OPTIONS.ARCHIPELAGO_PASSWORD,
            inputType: "password",
            placeholder: "Password",
          }),
        ]}
      />
    );
  }

  async connectAndLaunch() {
    const serverLink = this.getOptionValue(Permalink.OPTIONS.ARCHIPELAGO_LINK);
    const playerName = this.getOptionValue(Permalink.OPTIONS.ARCHIPELAGO_NAME);
    const password = this.getOptionValue(
      Permalink.OPTIONS.ARCHIPELAGO_PASSWORD,
    );

    if (!serverLink || !playerName) {
      toast.error(
        "Please enter both an Archipelago Server Link and Player Name.",
      );
      return;
    }

    try {
      toast.info("Connecting to Archipelago server...");

      const client = new Client();
      const loginOptions = {
        version: { major: 0, minor: 6, build: 6 },
        tags: ["Tracker", "NoText"],
      };
      if (password) {
        loginOptions.password = password;
      }
      const slotData = await client.login(
        serverLink,
        playerName,
        "The Wind Waker",
        loginOptions,
      );

      const seedName = client.room.seedName || "master";
      client.socket.disconnect();

      const options = SlotDataMapper.mapToOptions(slotData, seedName);
      _.set(options, Permalink.OPTIONS.ARCHIPELAGO_LINK, serverLink);
      _.set(options, Permalink.OPTIONS.ARCHIPELAGO_NAME, playerName);
      _.set(options, Permalink.OPTIONS.ARCHIPELAGO_PASSWORD, password || "");

      this.updateOptions(options);

      toast.success("Connected! Launching tracker...");

      const permalink = Permalink.encode(options);
      const encodedPermalink = encodeURIComponent(permalink);
      Launcher.openTrackerWindow(`/new/${encodedPermalink}`);
    } catch (err) {
      console.error("AP auto-configure failed:", err);
      toast.error(`Could not connect to AP server: ${err.message || err}`);
    }
  }

  launchNewTracker() {
    const encodedPermalink = this.encodedPermalink();

    Launcher.openTrackerWindow(`/new/${encodedPermalink}`);
  }

  loadFromSave() {
    const encodedPermalink = this.encodedPermalink();

    Launcher.openTrackerWindow(`/load/${encodedPermalink}`);
  }

  encodedPermalink() {
    const { permalink } = this.state;

    return encodeURIComponent(permalink);
  }

  async loadFromFile() {
    await Storage.loadFileAndStore();

    this.loadFromSave();
  }

  launchButtonContainer() {
    return (
      <div className="launcher-button-container">
        <button
          className="launcher-button"
          type="button"
          onClick={this.connectAndLaunch}
        >
          Connect & Launch
        </button>
        <button
          className="launcher-button"
          type="button"
          onClick={this.loadFromSave}
        >
          Load From Autosave
        </button>
      </div>
    );
  }

  render() {
    return (
      <div className="full-container">
        <div className="launcher-container">
          <div className="header">
            <img
              src={HEADER_IMAGE}
              alt="The Legend of Zelda: The Wind Waker Randomizer Tracker"
              draggable={false}
            />
          </div>
          <div className="password-notice">
            Password is not stored securely and is only used to connect to the
            Archipelago server.
          </div>
          <div className="beta-notice">
            Currently the ER Randomizer feature is in beta - Please report any
            bugs
          </div>
          <div className="settings">
            {this.archipelagoOptionsTable()}
            {this.launchButtonContainer()}
          </div>
          <div className="attribution">
            <span>
              Maintained by thesword1 • Based on Tracker(s) by wooferzfg and
              BigDunka •{" "}
            </span>
            <a
              href={`https://github.com/thesword1/WWRando-APTracker/commit/${COMMIT_HASH}`}
              target="_blank"
              rel="noreferrer"
            >
              Version: {COMMIT_HASH} ({BUILD_DATE})
            </a>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }
}
