import ApYaml from "./ap-yaml";

describe("ApYaml", () => {
  describe("getExcludedLocations", () => {
    test("returns the exclude_locations list for the player", () => {
      const yamlText = `
name: Link
game: The Wind Waker
The Wind Waker:
  exclude_locations:
    - Outset Island - Savage Labyrinth - Floor 30
    - Windfall Island - Mrs. Marie - Give 1 Joy Pendant
`;

      expect(ApYaml.getExcludedLocations(yamlText, "Link")).toEqual([
        "Outset Island - Savage Labyrinth - Floor 30",
        "Windfall Island - Mrs. Marie - Give 1 Joy Pendant",
      ]);
    });

    test("returns an empty list when exclude_locations is missing", () => {
      const yamlText = `
name: Link
game: The Wind Waker
The Wind Waker:
  sword_mode: start_with_sword
`;

      expect(ApYaml.getExcludedLocations(yamlText, "Link")).toEqual([]);
    });

    test("returns an empty list when exclude_locations is empty", () => {
      const yamlText = `
name: Link
game: The Wind Waker
The Wind Waker:
  exclude_locations: []
`;

      expect(ApYaml.getExcludedLocations(yamlText, "Link")).toEqual([]);
    });

    test("picks the matching player from a file with several players", () => {
      const yamlText = `
name: Zelda
game: The Wind Waker
The Wind Waker:
  exclude_locations:
    - Zelda's Location
---
name: Samus
game: Super Metroid
Super Metroid: {}
---
name: Link
game: The Wind Waker
The Wind Waker:
  exclude_locations:
    - Link's Location
`;

      expect(ApYaml.getExcludedLocations(yamlText, "Link")).toEqual([
        "Link's Location",
      ]);
    });

    describe("name placeholders", () => {
      const yamlTextForName = (name) => `
name: ${name}
game: The Wind Waker
The Wind Waker:
  exclude_locations:
    - Location
`;

      test("matches {number} and {player} to a number", () => {
        expect(ApYaml.getExcludedLocations(yamlTextForName("Link{number}"), "Link2")).toEqual(["Location"]);
        expect(ApYaml.getExcludedLocations(yamlTextForName("Link{player}"), "Link13")).toEqual(["Location"]);
      });

      test("does not match {number} to nothing", () => {
        expect(() => ApYaml.getExcludedLocations(yamlTextForName("Link{number}"), "Link")).toThrow(
          'The file has no player named "Link".',
        );
      });

      test("matches {NUMBER} and {PLAYER} to a number or nothing", () => {
        expect(ApYaml.getExcludedLocations(yamlTextForName("Link{NUMBER}"), "Link")).toEqual(["Location"]);
        expect(ApYaml.getExcludedLocations(yamlTextForName("Link{NUMBER}"), "Link2")).toEqual(["Location"]);
        expect(ApYaml.getExcludedLocations(yamlTextForName("Link{PLAYER}"), "Link")).toEqual(["Location"]);
      });

      test("treats other characters in the name literally", () => {
        expect(() => ApYaml.getExcludedLocations(yamlTextForName("L.nk"), "Link")).toThrow(
          'The file has no player named "Link".',
        );
      });
    });

    test("throws when the file is not valid YAML", () => {
      expect(() => ApYaml.getExcludedLocations("name: [Link", "Link")).toThrow(
        "The file is not valid YAML.",
      );
    });

    test("throws when the player is not playing Wind Waker", () => {
      const yamlText = `
name: Link
game: A Link to the Past
A Link to the Past: {}
`;

      expect(() => ApYaml.getExcludedLocations(yamlText, "Link")).toThrow(
        'The player "Link" is not playing "The Wind Waker".',
      );
    });

    test("throws when the game is a weighted list", () => {
      const yamlText = `
name: Link
game:
  The Wind Waker: 1
The Wind Waker: {}
`;

      expect(() => ApYaml.getExcludedLocations(yamlText, "Link")).toThrow(
        'The player "Link" is not playing "The Wind Waker".',
      );
    });

    test("throws when no player matches the name", () => {
      const yamlText = `
name: Zelda
game: The Wind Waker
The Wind Waker: {}
`;

      expect(() => ApYaml.getExcludedLocations(yamlText, "Link")).toThrow(
        'The file has no player named "Link".',
      );
    });

    test("throws when the player has no name", () => {
      const yamlText = `
game: The Wind Waker
The Wind Waker: {}
`;

      expect(() => ApYaml.getExcludedLocations(yamlText, "Link")).toThrow(
        'The file has no player named "Link".',
      );
    });

    test("picks the Wind Waker player when the name matches more than one player", () => {
      const yamlText = `
name: Link{number}
game: A Link to the Past
A Link to the Past: {}
---
name: Link{number}
game: The Wind Waker
The Wind Waker:
  exclude_locations:
    - Location
`;

      expect(ApYaml.getExcludedLocations(yamlText, "Link1")).toEqual(["Location"]);
    });

    test("throws when the player has no Wind Waker section", () => {
      const yamlText = `
name: Link
game: The Wind Waker
`;

      expect(() => ApYaml.getExcludedLocations(yamlText, "Link")).toThrow(
        'The player has no "The Wind Waker" section.',
      );
    });

    test("throws when exclude_locations is not a list", () => {
      const yamlText = `
name: Link
game: The Wind Waker
The Wind Waker:
  exclude_locations: Outset Island - Savage Labyrinth - Floor 30
`;

      expect(() => ApYaml.getExcludedLocations(yamlText, "Link")).toThrow(
        "exclude_locations must be a list of location names.",
      );
    });

    test("throws when exclude_locations has a non-text entry", () => {
      const yamlText = `
name: Link
game: The Wind Waker
The Wind Waker:
  exclude_locations:
    - Outset Island - Savage Labyrinth - Floor 30
    - key: value
`;

      expect(() => ApYaml.getExcludedLocations(yamlText, "Link")).toThrow(
        "exclude_locations must be a list of location names.",
      );
    });
  });
});
