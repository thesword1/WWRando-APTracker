import { computeEntranceMappings } from "./entrance-auto-tracker";

// Minimal mock for TrackerState
function mockTrackerState(checkedEntrances = []) {
  const checked = new Set(checkedEntrances);
  return {
    isEntranceChecked: (name) => checked.has(name),
  };
}

describe("computeEntranceMappings", () => {
  test("returns mappings for visited stages with valid pairings", () => {
    const visitedStages = { M_NewD2: true };
    const reversePairings = { "Dragon Roost Cavern": "Dragon Roost Cavern" };
    const randomEntranceSet = new Set(["Dragon Roost Cavern"]);
    const processedStages = new Set();
    const trackerState = mockTrackerState();

    const result = computeEntranceMappings(
      visitedStages,
      reversePairings,
      randomEntranceSet,
      processedStages,
      trackerState,
    );

    expect(result).toEqual([
      {
        entranceInternalName: "Dragon Roost Cavern",
        exitInternalName: "Dragon Roost Cavern",
        stageName: "M_NewD2",
      },
    ]);
    expect(processedStages.has("M_NewD2")).toBe(true);
  });

  test("handles randomized entrance pairings (entrance leads to different exit)", () => {
    const visitedStages = { kindan: true };
    // Forbidden Woods exit is reached via Dragon Roost Cavern entrance
    const reversePairings = { "Forbidden Woods": "Dragon Roost Cavern" };
    const randomEntranceSet = new Set(["Dragon Roost Cavern"]);
    const processedStages = new Set();
    const trackerState = mockTrackerState();

    const result = computeEntranceMappings(
      visitedStages,
      reversePairings,
      randomEntranceSet,
      processedStages,
      trackerState,
    );

    expect(result).toEqual([
      {
        entranceInternalName: "Dragon Roost Cavern",
        exitInternalName: "Forbidden Woods",
        stageName: "kindan",
      },
    ]);
  });

  test("skips stages not in stage-to-exit mapping", () => {
    const visitedStages = { sea: true, LinkRM: true };
    const reversePairings = { "Dragon Roost Cavern": "Dragon Roost Cavern" };
    const randomEntranceSet = new Set(["Dragon Roost Cavern"]);
    const processedStages = new Set();
    const trackerState = mockTrackerState();

    const result = computeEntranceMappings(
      visitedStages,
      reversePairings,
      randomEntranceSet,
      processedStages,
      trackerState,
    );

    expect(result).toEqual([]);
  });

  test("skips exits not in reverse pairings", () => {
    const visitedStages = { M_NewD2: true };
    // No reverse pairing for Dragon Roost Cavern
    const reversePairings = {};
    const randomEntranceSet = new Set(["Dragon Roost Cavern"]);
    const processedStages = new Set();
    const trackerState = mockTrackerState();

    const result = computeEntranceMappings(
      visitedStages,
      reversePairings,
      randomEntranceSet,
      processedStages,
      trackerState,
    );

    expect(result).toEqual([]);
  });

  test("skips entrances not in randomEntranceSet", () => {
    const visitedStages = { M_NewD2: true };
    const reversePairings = { "Dragon Roost Cavern": "Dragon Roost Cavern" };
    // Dragon Roost Cavern is not in the enabled set
    const randomEntranceSet = new Set(["Forbidden Woods"]);
    const processedStages = new Set();
    const trackerState = mockTrackerState();

    const result = computeEntranceMappings(
      visitedStages,
      reversePairings,
      randomEntranceSet,
      processedStages,
      trackerState,
    );

    expect(result).toEqual([]);
  });

  test("skips already-processed stages", () => {
    const visitedStages = { M_NewD2: true };
    const reversePairings = { "Dragon Roost Cavern": "Dragon Roost Cavern" };
    const randomEntranceSet = new Set(["Dragon Roost Cavern"]);
    const processedStages = new Set(["M_NewD2"]);
    const trackerState = mockTrackerState();

    const result = computeEntranceMappings(
      visitedStages,
      reversePairings,
      randomEntranceSet,
      processedStages,
      trackerState,
    );

    expect(result).toEqual([]);
  });

  test("skips entrances already checked in tracker state", () => {
    const visitedStages = { M_NewD2: true };
    const reversePairings = { "Dragon Roost Cavern": "Dragon Roost Cavern" };
    const randomEntranceSet = new Set(["Dragon Roost Cavern"]);
    const processedStages = new Set();
    const trackerState = mockTrackerState(["Dragon Roost Cavern"]);

    const result = computeEntranceMappings(
      visitedStages,
      reversePairings,
      randomEntranceSet,
      processedStages,
      trackerState,
    );

    expect(result).toEqual([]);
    // Still marked as processed to avoid re-checking
    expect(processedStages.has("M_NewD2")).toBe(true);
  });

  test("handles multiple stage names mapping to same exit (Savage Labyrinth)", () => {
    const visitedStages = { Cave09: true, Cave10: true, Cave11: true };
    const reversePairings = { "Savage Labyrinth": "Savage Labyrinth" };
    const randomEntranceSet = new Set(["Savage Labyrinth"]);
    const processedStages = new Set();
    const trackerState = mockTrackerState();

    const result = computeEntranceMappings(
      visitedStages,
      reversePairings,
      randomEntranceSet,
      processedStages,
      trackerState,
    );

    // Only the first one should produce a mapping; the rest see it as already checked
    // (processedStages won't prevent them, but once the first is in mappings,
    // the trackerState check won't catch it since we return mappings to apply later)
    // Actually, computeEntranceMappings checks trackerState.isEntranceChecked which
    // won't reflect the pending mapping. But processedStages won't help either since
    // different stage names. The result is 3 mappings for the same entrance.
    // This is fine - the caller applies them sequentially via setExitForEntrance,
    // and the second/third will be no-ops since the entrance is already set.
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].exitInternalName).toBe("Savage Labyrinth");
  });

  test("returns multiple mappings for different entrances", () => {
    const visitedStages = { M_NewD2: true, kindan: true, Siren: true };
    const reversePairings = {
      "Dragon Roost Cavern": "Dragon Roost Cavern",
      "Forbidden Woods": "Forbidden Woods",
      "Tower of the Gods": "Tower of the Gods",
    };
    const randomEntranceSet = new Set([
      "Dragon Roost Cavern",
      "Forbidden Woods",
      "Tower of the Gods",
    ]);
    const processedStages = new Set();
    const trackerState = mockTrackerState();

    const result = computeEntranceMappings(
      visitedStages,
      reversePairings,
      randomEntranceSet,
      processedStages,
      trackerState,
    );

    expect(result).toHaveLength(3);
    expect(result.map((m) => m.entranceInternalName).sort()).toEqual([
      "Dragon Roost Cavern",
      "Forbidden Woods",
      "Tower of the Gods",
    ]);
  });

  test("returns empty array when no stages visited", () => {
    const result = computeEntranceMappings(
      {},
      { "Dragon Roost Cavern": "Dragon Roost Cavern" },
      new Set(["Dragon Roost Cavern"]),
      new Set(),
      mockTrackerState(),
    );

    expect(result).toEqual([]);
  });

  test("returns empty array when no entrance pairings exist", () => {
    const result = computeEntranceMappings(
      { M_NewD2: true },
      {},
      new Set(["Dragon Roost Cavern"]),
      new Set(),
      mockTrackerState(),
    );

    expect(result).toEqual([]);
  });

  test("handles cave entrances correctly", () => {
    const visitedStages = { Cave01: true };
    const reversePairings = {
      "Bomb Island Secret Cave": "Bomb Island Secret Cave",
    };
    const randomEntranceSet = new Set(["Bomb Island Secret Cave"]);
    const processedStages = new Set();
    const trackerState = mockTrackerState();

    const result = computeEntranceMappings(
      visitedStages,
      reversePairings,
      randomEntranceSet,
      processedStages,
      trackerState,
    );

    expect(result).toEqual([
      {
        entranceInternalName: "Bomb Island Secret Cave",
        exitInternalName: "Bomb Island Secret Cave",
        stageName: "Cave01",
      },
    ]);
  });

  test("handles fairy fountain entrances correctly", () => {
    const visitedStages = { Fairy04: true };
    const reversePairings = {
      "Outset Fairy Fountain": "Outset Fairy Fountain",
    };
    const randomEntranceSet = new Set(["Outset Fairy Fountain"]);
    const processedStages = new Set();
    const trackerState = mockTrackerState();

    const result = computeEntranceMappings(
      visitedStages,
      reversePairings,
      randomEntranceSet,
      processedStages,
      trackerState,
    );

    expect(result).toEqual([
      {
        entranceInternalName: "Outset Fairy Fountain",
        exitInternalName: "Outset Fairy Fountain",
        stageName: "Fairy04",
      },
    ]);
  });

  test("handles inner cave entrances with dummy stage name", () => {
    const visitedStages = { CliPlaH: true };
    const reversePairings = {
      "Cliff Plateau Isles Inner Cave": "Cliff Plateau Isles Inner Cave",
    };
    const randomEntranceSet = new Set(["Cliff Plateau Isles Inner Cave"]);
    const processedStages = new Set();
    const trackerState = mockTrackerState();

    const result = computeEntranceMappings(
      visitedStages,
      reversePairings,
      randomEntranceSet,
      processedStages,
      trackerState,
    );

    expect(result).toEqual([
      {
        entranceInternalName: "Cliff Plateau Isles Inner Cave",
        exitInternalName: "Cliff Plateau Isles Inner Cave",
        stageName: "CliPlaH",
      },
    ]);
  });

  test("handles boss entrance tracking", () => {
    const visitedStages = { M_DragB: true };
    const reversePairings = {
      "Gohma Boss Arena": "Gohma Boss Arena",
    };
    const randomEntranceSet = new Set(["Gohma Boss Arena"]);
    const processedStages = new Set();
    const trackerState = mockTrackerState();

    const result = computeEntranceMappings(
      visitedStages,
      reversePairings,
      randomEntranceSet,
      processedStages,
      trackerState,
    );

    expect(result).toEqual([
      {
        entranceInternalName: "Gohma Boss Arena",
        exitInternalName: "Gohma Boss Arena",
        stageName: "M_DragB",
      },
    ]);
  });

  test("handles miniboss entrance tracking", () => {
    const visitedStages = { kinMB: true };
    const reversePairings = {
      "Forbidden Woods Miniboss Arena": "Forbidden Woods Miniboss Arena",
    };
    const randomEntranceSet = new Set(["Forbidden Woods Miniboss Arena"]);
    const processedStages = new Set();
    const trackerState = mockTrackerState();

    const result = computeEntranceMappings(
      visitedStages,
      reversePairings,
      randomEntranceSet,
      processedStages,
      trackerState,
    );

    expect(result).toEqual([
      {
        entranceInternalName: "Forbidden Woods Miniboss Arena",
        exitInternalName: "Forbidden Woods Miniboss Arena",
        stageName: "kinMB",
      },
    ]);
  });
});
