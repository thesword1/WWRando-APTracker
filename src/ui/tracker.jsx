import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { Oval } from "react-loader-spinner";
import { ToastContainer, toast } from "react-toastify";

import Locations from "../services/locations";
import LogicHelper from "../services/logic-helper";
import Permalink from "../services/permalink";
import TrackerController from "../services/tracker-controller";
import ArchipelagoInterface from "../services/ArchipelagoInterface";

import Buttons from "./buttons";
import Images from "./images";
import ItemsTable from "./items-table";
import LocationsTable from "./locations-table";
import SettingsWindow from "./settings-window";
import SphereTracking from "./sphere-tracking";
import Statistics from "./statistics";
import Storage from "./storage";

import "react-toastify/dist/ReactToastify.css";
import { SliderPicker } from "react-color";

class Tracker extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      chartListOpen: false,
      clearAllIncludesMail: true,
      settingsWindowOpen: false,
      colors: {
        extraLocationsBackground: null,
        itemsTableBackground: null,
        sphereTrackingBackground: null,
        statisticsBackground: null,
      },
      disableLogic: false,
      isLoading: true,
      lastLocation: null,
      onlyProgressLocations: true,
      openedChartForIsland: null,
      openedEntrance: null,
      openedExit: null,
      openedLocation: null,
      openedLocationIsDungeon: null,
      rightClickToClearAll: true,
      trackNonProgressCharts: false,
      trackSpheres: false,
      viewingEntrances: false,
      hintedLocations: {},
      hintsForMe: [],
      myHints: [],
      showHintPanel: false,
      showInfoLegend: false,
    };

    this.initialize();

    this.clearAllLocations = this.clearAllLocations.bind(this);
    this.clearOpenedMenus = this.clearOpenedMenus.bind(this);
    this.decrementItem = this.decrementItem.bind(this);
    this.incrementItem = this.incrementItem.bind(this);
    this.toggleChartList = this.toggleChartList.bind(this);
    this.toggleSettingsWindow = this.toggleSettingsWindow.bind(this);
    this.toggleEntrances = this.toggleEntrances.bind(this);
    this.toggleLocationChecked = this.toggleLocationChecked.bind(this);

    this.toggleRequiredBoss = this.toggleRequiredBoss.bind(this);
    this.unsetChartMapping = this.unsetChartMapping.bind(this);
    this.unsetEntrance = this.unsetEntrance.bind(this);
    this.unsetExit = this.unsetExit.bind(this);
    this.unsetLastLocation = this.unsetLastLocation.bind(this);
    this.updateChartMapping = this.updateChartMapping.bind(this);
    this.updateExitForEntrance = this.updateExitForEntrance.bind(this);
    this.updateOpenedChartForIsland =
      this.updateOpenedChartForIsland.bind(this);
    this.updateOpenedEntrance = this.updateOpenedEntrance.bind(this);
    this.updateOpenedExit = this.updateOpenedExit.bind(this);
    this.updateOpenedLocation = this.updateOpenedLocation.bind(this);
    this.updatePreferences = this.updatePreferences.bind(this);
    this.toggleHintPanel = this.toggleHintPanel.bind(this);
    this.toggleInfoLegend = this.toggleInfoLegend.bind(this);
  }

  async initialize() {
    await Images.importImages();

    const preferences = Storage.loadPreferences();
    if (!_.isNil(preferences)) {
      this.updatePreferences(preferences);
    }

    const { loadProgress, permalink } = this.props;

    let archipelagoConnection;

    let initialData;

    let decodedPermalink;

    if (loadProgress) {
      const saveData = Storage.loadFromStorage();

      if (!_.isNil(saveData)) {
        try {
          const { settings } = JSON.parse(saveData);
          const options = settings.options;
          decodedPermalink = Permalink.encode(options);
        } catch (err) {
          toast.error("Could not load progress from save data!");
        }
      } else {
        toast.error("Could not load progress from save data!");
      }
    }

    if (_.isNil(decodedPermalink)) {
      decodedPermalink = decodeURIComponent(permalink);
    }

    try {
      initialData =
        await TrackerController.initializeFromPermalink(decodedPermalink);
    } catch (err) {
      toast.error("Tracker could not be initialized!");
      throw err;
    }

    try {
      archipelagoConnection = new ArchipelagoInterface(decodedPermalink);
    } catch (err) {
      toast.error("Archipelago Tracker could not be initialized!");
      throw err;
    }

    const locationQueue = [];
    const rateLimit = 150; // 1 second rate limit
    let isProcessingLocations = false;

    const processQueueLocations = () => {
      if (locationQueue.length === 0) {
        isProcessingLocations = false;
        return;
      }

      const data = locationQueue.shift();
      console.log(`Received data: ${JSON.stringify(data)}`);
      const playerName = archipelagoConnection.getName();

      if (data.includes(playerName + " found their")) {
        console.log(data);
        // Only mark location as checked; item incrementing is handled by itemsReceived
        const locationMatch = parseLocation(data);
        if (locationMatch) {
          const generalLocation = locationMatch[1];
          const detailedLocation = locationMatch[2];
          const trackerState =
            this._latestTrackerState || this.state.trackerState;
          if (
            !trackerState.isLocationChecked(generalLocation, detailedLocation)
          ) {
            const newTrackerState = trackerState.toggleLocationChecked(
              generalLocation,
              detailedLocation,
            );
            this.setState({
              lastLocation: { generalLocation, detailedLocation },
            });
            this.updateTrackerState(newTrackerState);
            console.log(locationMatch[0] + " has been marked as checked");
          } else {
            console.log(locationMatch[0] + " was already checked");
          }
        }
      }

      setTimeout(processQueueLocations, rateLimit);
    };

    archipelagoConnection.on("message", (data) => {
      locationQueue.push(data);
      if (!isProcessingLocations) {
        isProcessingLocations = true;
        processQueueLocations();
      }
    });

    // State sync on connection
    archipelagoConnection.on("connected", () => {
      console.log("Syncing state from AP server...");

      let trackerState = this._latestTrackerState || this.state.trackerState;

      // Sync received items — build up state without intermediate renders
      const receivedItems = archipelagoConnection.getReceivedItems();
      for (const item of receivedItems) {
        try {
          const itemName = mapAPItemName(item.name);
          if (!itemName) continue;

          const currentCount = trackerState.getItemValue(itemName);
          if (_.isNil(currentCount)) {
            console.log(`Unknown item for auto-tracking: ${itemName}`);
            continue;
          }
          const maxCount = LogicHelper.maxItemCount(itemName);
          if (currentCount < maxCount) {
            trackerState = trackerState.incrementItem(itemName);
            console.log(
              `Synced item: ${itemName} (${currentCount + 1}/${maxCount})`,
            );
          }
        } catch (err) {
          console.warn("Could not sync item:", err);
        }
      }

      // Sync checked locations
      const checkedLocationIds = archipelagoConnection.getCheckedLocationIds();
      for (const locationId of checkedLocationIds) {
        try {
          const locationName =
            archipelagoConnection.lookupLocationName(locationId);
          if (!locationName) continue;

          const { generalLocation, detailedLocation } =
            Locations.splitLocationName(locationName);
          if (
            !trackerState.isLocationChecked(generalLocation, detailedLocation)
          ) {
            trackerState = trackerState.toggleLocationChecked(
              generalLocation,
              detailedLocation,
            );
          }
        } catch (err) {
          console.warn("Could not sync location:", locationId, err);
        }
      }

      // Apply all state changes in one update
      this.updateTrackerState(trackerState);

      // Sync hints
      const hints = archipelagoConnection.getHints();
      if (hints && hints.length > 0) {
        this.processHints(hints, archipelagoConnection);
      }

      this.setState({ isLoading: false });
      console.log("State sync complete.");
    });

    // Subsequent item events
    archipelagoConnection.on("itemsReceived", (items) => {
      let trackerState = this._latestTrackerState || this.state.trackerState;
      const mySlot = archipelagoConnection.getPlayerSlot();
      for (const item of items) {
        try {
          const itemName = mapAPItemName(item.name);
          if (!itemName) continue;

          const currentCount = trackerState.getItemValue(itemName);
          if (_.isNil(currentCount)) {
            console.log(`Unknown item for auto-tracking: ${itemName}`);
            continue;
          }
          const maxCount = LogicHelper.maxItemCount(itemName);
          if (currentCount < maxCount) {
            trackerState = trackerState.incrementItem(itemName);
            console.log(
              `Auto-tracked item: ${itemName} (${currentCount + 1}/${maxCount})`,
            );
          }
          this.markHintsFoundByItem(item.name, mySlot);
        } catch (err) {
          console.warn("Could not process received item:", err);
        }
      }
      this.updateTrackerState(trackerState);
    });

    // Subsequent location check events
    archipelagoConnection.on("locationsChecked", (locationIds) => {
      let trackerState = this._latestTrackerState || this.state.trackerState;
      const mySlot = archipelagoConnection.getPlayerSlot();
      for (const locationId of locationIds) {
        try {
          const locationName =
            archipelagoConnection.lookupLocationName(locationId);
          if (!locationName) continue;

          const { generalLocation, detailedLocation } =
            Locations.splitLocationName(locationName);
          if (
            !trackerState.isLocationChecked(generalLocation, detailedLocation)
          ) {
            trackerState = trackerState.toggleLocationChecked(
              generalLocation,
              detailedLocation,
            );
          }
          this.markHintsFoundByLocation(locationName, mySlot);
        } catch (err) {
          console.warn("Could not process checked location:", locationId, err);
        }
      }
      this.updateTrackerState(trackerState);
    });

    // Hint events
    archipelagoConnection.on("hintsInitialized", (hints) => {
      console.log("hintsInitialized event fired, hints:", hints);
      this.processHints(hints, archipelagoConnection);
    });

    archipelagoConnection.on("hintReceived", (hint) => {
      console.log("hintReceived event fired, hint:", hint);
      this.processHints([hint], archipelagoConnection);
    });

    const { logic, saveData, spheres, trackerState } = initialData;

    this._latestTrackerState = trackerState;
    this.setState({
      logic,
      saveData,
      spheres,
      trackerState,
    });
  }

  incrementItem(itemName) {
    const { lastLocation, trackerState } = this.state;

    let newTrackerState = trackerState.incrementItem(itemName);

    if (!_.isNil(lastLocation)) {
      const { generalLocation, detailedLocation } = lastLocation;

      newTrackerState = newTrackerState.setItemForLocation(
        itemName,
        generalLocation,
        detailedLocation,
      );
    }

    this.updateTrackerState(newTrackerState);
  }

  decrementItem(itemName) {
    const { trackerState } = this.state;

    const newTrackerState = trackerState.decrementItem(itemName);

    this.updateTrackerState(newTrackerState);
  }

  toggleLocationChecked(generalLocation, detailedLocation) {
    const { trackerState } = this.state;

    let newTrackerState = trackerState.toggleLocationChecked(
      generalLocation,
      detailedLocation,
    );

    if (newTrackerState.isLocationChecked(generalLocation, detailedLocation)) {
      this.setState({
        lastLocation: {
          generalLocation,
          detailedLocation,
        },
      });
    } else {
      this.setState({ lastLocation: null });

      newTrackerState = newTrackerState.unsetItemForLocation(
        generalLocation,
        detailedLocation,
      );
    }

    this.updateTrackerState(newTrackerState);
  }

  autoIncrementItem(itemName) {
    const { trackerState } = this.state;

    const currentCount = trackerState.getItemValue(itemName);
    if (_.isNil(currentCount)) {
      console.log(`Unknown item for auto-tracking: ${itemName}`);
      return;
    }

    const maxCount = LogicHelper.maxItemCount(itemName);
    if (currentCount >= maxCount) {
      console.log(
        `Item already at max: ${itemName} (${currentCount}/${maxCount})`,
      );
      return;
    }

    const newTrackerState = trackerState.incrementItem(itemName);
    this.updateTrackerState(newTrackerState);
    console.log(
      `Auto-tracked item: ${itemName} (${currentCount + 1}/${maxCount})`,
    );
  }

  handleArchipelagoFoundItem(params, itemName) {
    const { trackerState } = this.state;

    let newTrackerState = trackerState;

    // Mark location as checked
    const locationMatch = parseLocation(params);
    if (locationMatch) {
      const generalLocation = locationMatch[1];
      const detailedLocation = locationMatch[2];

      if (
        !newTrackerState.isLocationChecked(generalLocation, detailedLocation)
      ) {
        newTrackerState = newTrackerState.toggleLocationChecked(
          generalLocation,
          detailedLocation,
        );
        this.setState({
          lastLocation: {
            generalLocation,
            detailedLocation,
          },
        });
        console.log(locationMatch[0] + " has been marked as checked");
      } else {
        console.log(locationMatch[0] + " was already checked");
      }
    }

    // Increment item
    if (itemName) {
      const currentCount = newTrackerState.getItemValue(itemName);
      if (!_.isNil(currentCount)) {
        const maxCount = LogicHelper.maxItemCount(itemName);
        if (currentCount < maxCount) {
          newTrackerState = newTrackerState.incrementItem(itemName);
          console.log(
            `Auto-tracked item: ${itemName} (${currentCount + 1}/${maxCount})`,
          );
        } else {
          console.log(
            `Item already at max: ${itemName} (${currentCount}/${maxCount})`,
          );
        }
      } else {
        console.log(`Unknown item for auto-tracking: ${itemName}`);
      }
    }

    if (newTrackerState !== trackerState) {
      this.updateTrackerState(newTrackerState);
    }
  }

  processHints(hints, archipelagoConnection) {
    const { hintedLocations, hintsForMe, myHints } = this.state;
    const newHintedLocations = { ...hintedLocations };
    const newHintsForMe = [...hintsForMe];
    const newMyHints = [...myHints];

    const mySlot = archipelagoConnection.getPlayerSlot();
    console.log(
      "processHints called, mySlot:",
      mySlot,
      "hints count:",
      hints.length,
    );

    for (const hint of hints) {
      console.log("Processing hint:", {
        itemName: hint.item?.name,
        locationName: hint.item?.locationName,
        senderSlot: hint.item?.sender?.slot,
        senderName: hint.item?.sender?.name,
        receiverSlot: hint.item?.receiver?.slot,
        receiverName: hint.item?.receiver?.name,
        found: hint.found,
      });

      const hintData = {
        itemName: hint.item?.name || "Unknown Item",
        locationName: hint.item?.locationName || "Unknown Location",
        finderName: hint.item?.sender?.name || "Unknown",
        finderGame: hint.item?.sender?.game || "Unknown",
        receiverName: hint.item?.receiver?.name || "Unknown",
        receiverGame: hint.item?.receiver?.game || "Unknown",
        senderSlot: hint.item?.sender?.slot,
        receiverSlot: hint.item?.receiver?.slot,
        found: hint.found || false,
      };

      const isMyItem = hint.item?.receiver?.slot === mySlot;
      const isMyWorldLocation = hint.item?.sender?.slot === mySlot;
      console.log(
        "isMyItem:",
        isMyItem,
        "isMyWorldLocation:",
        isMyWorldLocation,
      );

      if (isMyItem) {
        newHintsForMe.push(hintData);
      }

      if (isMyWorldLocation && !isMyItem) {
        newMyHints.push(hintData);
      }

      // Mark hinted locations for purple border (applies for all hints in my world)
      if (isMyWorldLocation) {
        try {
          const apLocationName = hint.item?.locationName;
          if (apLocationName) {
            const { generalLocation, detailedLocation } =
              Locations.splitLocationName(apLocationName);
            if (!newHintedLocations[generalLocation]) {
              newHintedLocations[generalLocation] = new Set();
            }
            newHintedLocations[generalLocation].add(detailedLocation);
          }
        } catch (err) {
          console.warn(
            "Could not parse hint location:",
            hint.item?.locationName,
            err,
          );
        }
      }
    }

    this.setState({
      hintedLocations: newHintedLocations,
      hintsForMe: newHintsForMe,
      myHints: newMyHints,
    });
  }

  markHintsFoundByLocation(locationName, mySlot) {
    const { hintsForMe, myHints } = this.state;
    let changed = false;

    // Mark hints in myHints (other's items at my locations)
    const updatedMyHints = myHints.map((hint) => {
      if (!hint.found && hint.locationName === locationName) {
        changed = true;
        return { ...hint, found: true };
      }
      return hint;
    });

    // Mark hints in hintsForMe where the location is in my own world
    const updatedHintsForMe = hintsForMe.map((hint) => {
      if (
        !hint.found &&
        hint.locationName === locationName &&
        hint.senderSlot === mySlot
      ) {
        changed = true;
        return { ...hint, found: true };
      }
      return hint;
    });

    if (changed) {
      this.setState({
        hintsForMe: updatedHintsForMe,
        myHints: updatedMyHints,
      });
    }
  }

  markHintsFoundByItem(itemName, mySlot) {
    const { hintsForMe } = this.state;
    let changed = false;

    // Only mark hints where the item is from someone else's world
    // Items from my own world are handled by markHintsFoundByLocation
    const updatedHintsForMe = hintsForMe.map((hint) => {
      if (
        !hint.found &&
        hint.itemName === itemName &&
        hint.senderSlot !== mySlot
      ) {
        changed = true;
        return { ...hint, found: true };
      }
      return hint;
    });

    if (changed) {
      this.setState({ hintsForMe: updatedHintsForMe });
    }
  }

  toggleHintPanel() {
    const { showHintPanel } = this.state;
    this.setState({ showHintPanel: !showHintPanel });
  }

  toggleInfoLegend() {
    const { showInfoLegend } = this.state;
    this.setState({ showInfoLegend: !showInfoLegend });
  }

  toggleArchipelagoLocationChecked(params) {
    const { trackerState } = this.state;

    let locationMatch = parseLocation(params);
    let newTrackerState;
    let generalLocation = locationMatch[1];
    let detailedLocation = locationMatch[2];
    if (!trackerState.isLocationChecked(generalLocation, detailedLocation)) {
      newTrackerState = trackerState.toggleLocationChecked(
        generalLocation,
        detailedLocation,
      );
      this.setState({
        lastLocation: {
          generalLocation,
          detailedLocation,
        },
      });
      this.updateTrackerState(newTrackerState);
      console.log(locationMatch[0] + "has been marked as checked");
    } else {
      this.setState({ lastLocation: null });
      console.log(locationMatch[0] + "was already checked");
    }
  }

  clearAllLocations(zoneName) {
    const { clearAllIncludesMail, trackerState } = this.state;

    const newTrackerState = trackerState.clearBannedLocations(zoneName, {
      includeAdditionalLocations: clearAllIncludesMail,
    });

    this.updateTrackerState(newTrackerState);
  }

  toggleRequiredBoss(dungeonName) {
    let { trackerState: newTrackerState } = this.state;

    if (LogicHelper.isBossRequired(dungeonName)) {
      newTrackerState = newTrackerState.clearBannedLocations(dungeonName, {
        includeAdditionalLocations: true,
      });
      LogicHelper.setBossNotRequired(dungeonName);
    } else {
      LogicHelper.setBossRequired(dungeonName);
    }

    this.updateTrackerState(newTrackerState);
  }

  updateTrackerState(newTrackerState) {
    const { logic, saveData, spheres, trackerState } =
      TrackerController.refreshState(newTrackerState);

    // Keep a synchronous reference so rapid async events always see the latest state
    this._latestTrackerState = trackerState;

    Storage.saveToStorage(saveData);
    this.setState({
      logic,
      saveData,
      spheres,
      trackerState,
    });
  }

  clearOpenedMenus() {
    this.setState({
      chartListOpen: false,
      openedChartForIsland: null,
      openedEntrance: null,
      openedExit: null,
      openedLocation: null,
      openedLocationIsDungeon: null,
    });
  }

  updateOpenedEntrance(entranceName) {
    this.setState({
      chartListOpen: false,
      openedChartForIsland: null,
      openedEntrance: entranceName,
      openedExit: null,
      openedLocation: null,
      openedLocationIsDungeon: null,
    });
  }

  updateOpenedExit(exitName) {
    this.setState({
      chartListOpen: false,
      openedChartForIsland: null,
      openedEntrance: null,
      openedExit: exitName,
      openedLocation: null,
      openedLocationIsDungeon: null,
    });
  }

  unsetEntrance(entranceName) {
    const { trackerState } = this.state;

    const newTrackerState = trackerState.unsetEntrance(entranceName);

    this.updateTrackerState(newTrackerState);
  }

  unsetExit(exitName) {
    const { trackerState } = this.state;

    const newTrackerState = trackerState.unsetExit(exitName);

    this.updateTrackerState(newTrackerState);
  }

  updateExitForEntrance(entranceName, exitName) {
    const { trackerState } = this.state;

    const newTrackerState = trackerState.setExitForEntrance(
      entranceName,
      exitName,
    );

    this.updateTrackerState(newTrackerState);
    this.clearOpenedMenus();
  }

  updateOpenedLocation({ locationName, isDungeon }) {
    this.setState({
      chartListOpen: false,
      openedChartForIsland: null,
      openedEntrance: null,
      openedExit: null,
      openedLocation: locationName,
      openedLocationIsDungeon: isDungeon,
    });
  }

  updateChartMapping(chart, chartForIsland) {
    const { lastLocation, trackerState } = this.state;

    let newTrackerState = trackerState.setChartMapping(chart, chartForIsland);

    if (newTrackerState.getItemValue(chart) === 0) {
      newTrackerState = newTrackerState.incrementItem(chart);

      if (!_.isNil(lastLocation)) {
        const { generalLocation, detailedLocation } = lastLocation;

        newTrackerState = newTrackerState.setItemForLocation(
          chart,
          generalLocation,
          detailedLocation,
        );
      }
    }

    if (newTrackerState.getItemValue(chartForIsland) === 0) {
      newTrackerState = newTrackerState.incrementItem(chartForIsland);
    }

    this.updateTrackerState(newTrackerState);
    this.clearOpenedMenus();
  }

  // Unset via sector should only remove mapping.
  // Unset via chart-list should remove both mapping and decrement chart.
  unsetChartMapping(chartForIsland, decrementChart) {
    const { trackerState } = this.state;
    let newTrackerState = trackerState;

    if (decrementChart) {
      const island = LogicHelper.islandFromChartForIsland(chartForIsland);
      const chart = trackerState.getChartFromChartMapping(island);

      newTrackerState = newTrackerState.decrementItem(chart);
    }

    newTrackerState = newTrackerState
      .decrementItem(chartForIsland)
      .unsetChartMapping(chartForIsland);

    this.updateTrackerState(newTrackerState);
  }

  updateOpenedChartForIsland(openedChartForIsland) {
    this.setState({
      chartListOpen: false,
      openedChartForIsland,
      openedEntrance: null,
      openedExit: null,
      openedLocation: null,
      openedLocationIsDungeon: null,
    });
  }

  toggleChartList() {
    const { chartListOpen } = this.state;

    this.setState({
      chartListOpen: !chartListOpen,
      openedChartForIsland: null,
      openedEntrance: null,
      openedExit: null,
      openedLocation: null,
      openedLocationIsDungeon: null,
    });
  }

  toggleSettingsWindow() {
    const { settingsWindowOpen } = this.state;

    this.setState({
      settingsWindowOpen: !settingsWindowOpen,
    });
  }

  toggleEntrances() {
    const { viewingEntrances } = this.state;

    this.updatePreferences({ viewingEntrances: !viewingEntrances });
  }

  unsetLastLocation() {
    this.setState({ lastLocation: null });
  }

  updatePreferences(preferenceChanges) {
    const {
      clearAllIncludesMail,
      disableLogic,
      onlyProgressLocations,
      colors,
      rightClickToClearAll,
      trackNonProgressCharts,
      trackSpheres,
      viewingEntrances,
    } = this.state;

    const existingPreferences = {
      clearAllIncludesMail,
      colors,
      disableLogic,
      onlyProgressLocations,
      rightClickToClearAll,
      trackNonProgressCharts,
      trackSpheres,
      viewingEntrances,
    };

    const newPreferences = _.merge({}, existingPreferences, preferenceChanges);

    this.setState(newPreferences);
    Storage.savePreferences(newPreferences);
  }

  render() {
    const {
      chartListOpen,
      clearAllIncludesMail,
      colors,
      disableLogic,
      hintedLocations,
      hintsForMe,
      isLoading,
      lastLocation,
      logic,
      myHints,
      onlyProgressLocations,
      openedChartForIsland,
      openedEntrance,
      openedExit,
      openedLocation,
      openedLocationIsDungeon,
      rightClickToClearAll,
      saveData,
      settingsWindowOpen,
      showHintPanel,
      showInfoLegend,
      spheres,
      trackNonProgressCharts,
      trackSpheres,
      trackerState,
      viewingEntrances,
    } = this.state;

    const {
      extraLocationsBackground,
      itemsTableBackground,
      sphereTrackingBackground,
      statisticsBackground,
    } = colors;

    let content;

    if (isLoading) {
      content = (
        <div className="loading-spinner">
          <Oval color="white" secondaryColor="gray" />
        </div>
      );
    } else {
      content = (
        <div className="tracker-container">
          <div className="tracker">
            <ItemsTable
              backgroundColor={itemsTableBackground}
              decrementItem={this.decrementItem}
              incrementItem={this.incrementItem}
              spheres={spheres}
              trackerState={trackerState}
              trackSpheres={trackSpheres}
            />
            <LocationsTable
              backgroundColor={extraLocationsBackground}
              chartListOpen={chartListOpen}
              clearAllLocations={this.clearAllLocations}
              clearOpenedMenus={this.clearOpenedMenus}
              decrementItem={this.decrementItem}
              disableLogic={disableLogic}
              hintedLocations={hintedLocations}
              incrementItem={this.incrementItem}
              logic={logic}
              onlyProgressLocations={onlyProgressLocations}
              openedChartForIsland={openedChartForIsland}
              openedEntrance={openedEntrance}
              openedExit={openedExit}
              openedLocation={openedLocation}
              openedLocationIsDungeon={openedLocationIsDungeon}
              rightClickToClearAll={rightClickToClearAll}
              spheres={spheres}
              toggleLocationChecked={this.toggleLocationChecked}
              toggleRequiredBoss={this.toggleRequiredBoss}
              trackerState={trackerState}
              trackNonProgressCharts={trackNonProgressCharts}
              trackSpheres={trackSpheres}
              updateChartMapping={this.updateChartMapping}
              updateOpenedChartForIsland={this.updateOpenedChartForIsland}
              unsetChartMapping={this.unsetChartMapping}
              unsetEntrance={this.unsetEntrance}
              unsetExit={this.unsetExit}
              updateExitForEntrance={this.updateExitForEntrance}
              updateOpenedEntrance={this.updateOpenedEntrance}
              updateOpenedExit={this.updateOpenedExit}
              updateOpenedLocation={this.updateOpenedLocation}
              viewingEntrances={viewingEntrances}
            />
            <Statistics
              backgroundColor={statisticsBackground}
              disableLogic={disableLogic}
              logic={logic}
              onlyProgressLocations={onlyProgressLocations}
            />
          </div>
          {trackSpheres && (
            <SphereTracking
              backgroundColor={sphereTrackingBackground}
              lastLocation={lastLocation}
              trackerState={trackerState}
              unsetLastLocation={this.unsetLastLocation}
            />
          )}
          {settingsWindowOpen && (
            <SettingsWindow
              clearAllIncludesMail={clearAllIncludesMail}
              disableLogic={disableLogic}
              extraLocationsBackground={extraLocationsBackground}
              itemsTableBackground={itemsTableBackground}
              onlyProgressLocations={onlyProgressLocations}
              rightClickToClearAll={rightClickToClearAll}
              sphereTrackingBackground={sphereTrackingBackground}
              statisticsBackground={statisticsBackground}
              toggleSettingsWindow={this.toggleSettingsWindow}
              trackNonProgressCharts={trackNonProgressCharts}
              trackSpheres={trackSpheres}
              updatePreferences={this.updatePreferences}
            />
          )}
          {showHintPanel && (
            <div className="hint-panel">
              <div className="hint-panel-header">
                <strong>My Items</strong>
              </div>
              {hintsForMe.length === 0 ? (
                <div className="hint-entry">No hints yet</div>
              ) : (
                hintsForMe.map((hint, i) => (
                  <div
                    key={`hfm-${i}`}
                    className={`hint-entry${hint.found ? " hint-found" : ""}`}
                  >
                    <span className="hint-item">{hint.itemName}</span>
                    {" at "}
                    <span className="hint-location">{hint.locationName}</span>
                    {" ("}
                    {hint.finderName}
                    {")"}
                    {hint.found && " [Found]"}
                  </div>
                ))
              )}
              <div className="hint-panel-header" style={{ marginTop: "8px" }}>
                <strong>Other's Items</strong>
              </div>
              {myHints.length === 0 ? (
                <div className="hint-entry">No hints yet</div>
              ) : (
                myHints.map((hint, i) => (
                  <div
                    key={`mh-${i}`}
                    className={`hint-entry${hint.found ? " hint-found" : ""}`}
                  >
                    <span className="hint-item">{hint.itemName}</span>
                    {" at "}
                    <span className="hint-location">{hint.locationName}</span>
                    {" for "}
                    {hint.receiverName}
                    {hint.found && " [Found]"}
                  </div>
                ))
              )}
            </div>
          )}
          {showInfoLegend && (
            <div className="info-legend">
              <div>
                <strong>Color Legend</strong>
              </div>
              <div>
                <span className="available-location">Blue</span> = Accessible
              </div>
              <div>
                <span className="unavailable-location">Red</span> = Not
                Accessible
              </div>
              <div>
                <span className="non-progress-location">Yellow</span> =
                Non-Progress
              </div>
              <div>
                <span
                  style={{
                    border: "2px solid #9b30ff",
                    borderRadius: "3px",
                    padding: "0 3px",
                  }}
                >
                  Purple Border
                </span>{" "}
                = Hinted
              </div>
              <div>
                <span style={{ textDecoration: "line-through" }}>
                  Strikethrough
                </span>{" "}
                = Checked
              </div>
            </div>
          )}
          <Buttons
            settingsWindowOpen={settingsWindowOpen}
            chartListOpen={chartListOpen}
            showHintPanel={showHintPanel}
            showInfoLegend={showInfoLegend}
            toggleChartList={this.toggleChartList}
            toggleHintPanel={this.toggleHintPanel}
            toggleInfoLegend={this.toggleInfoLegend}
            toggleSettingsWindow={this.toggleSettingsWindow}
            toggleEntrances={this.toggleEntrances}
            trackNonProgressCharts={trackNonProgressCharts}
            viewingEntrances={viewingEntrances}
          />
        </div>
      );
    }

    return (
      <>
        {content}
        <ToastContainer />
      </>
    );
  }
}

function parseLocation(params) {
  const locationExceptions = [
    "Five-Star Isles",
    "Two-Eye Reef",
    "Five-Eye Reef",
    "Three-Eye Reef",
    "Six-Eye Reef",
    "Four-Eye Reef",
    "Seven-Star Isles",
  ];
  let regex = /.*\(([^)]+)\)/;
  let match = params.match(regex);

  if (match && match[1]) {
    const fullLocation = match[1];
    let splitLocation;
    if (containsElement(fullLocation, locationExceptions)) {
      const regex = /(.+?) - (.+)/;
      splitLocation = fullLocation.match(regex);
    } else {
      let regex = /([^ -]+(?: [^-]+)*) - (.*)/;
      splitLocation = fullLocation.match(regex);
    }

    return splitLocation;
  }
}

function parseItem(params) {
  let regex = /.*found their ([^(]+)./;
  let item = params.match(regex);
  console.log(item);
  return item;
}

function parseFoundItem(message) {
  const match = message.match(/found their (.+?) \(/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

function parseSentItem(message, playerName) {
  const regex = new RegExp(`sent (.+?) to ${_.escapeRegExp(playerName)}`);
  const match = message.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

function containsElement(str, list) {
  return list.some((element) => str.includes(element));
}

// AP uses individual names for items the tracker groups as one counter,
// and different display names for some progressive items.
const TINGLE_STATUE_NAMES = new Set([
  "Dragon Tingle Statue",
  "Forbidden Tingle Statue",
  "Goddess Tingle Statue",
  "Earth Tingle Statue",
  "Wind Tingle Statue",
]);

const AP_ITEM_NAME_MAP = {
  "Bomb Bag Capacity Upgrade": "Progressive Bomb Bag",
  "Wallet Capacity Upgrade": "Progressive Wallet",
  "Quiver Capacity Upgrade": "Progressive Quiver",
};

function mapAPItemName(apName) {
  if (!apName) return apName;
  if (apName.startsWith("Triforce Shard")) return "Triforce Shard";
  if (TINGLE_STATUE_NAMES.has(apName)) return "Tingle Statue";
  if (AP_ITEM_NAME_MAP[apName]) return AP_ITEM_NAME_MAP[apName];
  return apName;
}

function sleep(params) {
  return new Promise((resolve) => setTimeout(resolve, params));
}

Tracker.propTypes = {
  loadProgress: PropTypes.bool.isRequired,
  permalink: PropTypes.string.isRequired,
};

export default Tracker;

console.log(Tracker);
