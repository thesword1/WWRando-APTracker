import Permalink from "./permalink";
import SlotDataMapper from "./slot-data-mapper";

describe("SlotDataMapper", () => {
  describe("mapToOptions", () => {
    const fullSlotData = {
      progression_dungeons: 1,
      progression_tingle_chests: 1,
      progression_dungeon_secrets: 1,
      progression_puzzle_secret_caves: 1,
      progression_combat_secret_caves: 0,
      progression_savage_labyrinth: 0,
      progression_great_fairies: 1,
      progression_short_sidequests: 0,
      progression_long_sidequests: 0,
      progression_spoils_trading: 0,
      progression_minigames: 1,
      progression_battlesquid: 1,
      progression_free_gifts: 1,
      progression_mail: 1,
      progression_platforms_rafts: 0,
      progression_submarines: 1,
      progression_eye_reef_chests: 0,
      progression_big_octos_gunboats: 0,
      progression_triforce_charts: 0,
      progression_treasure_charts: 0,
      progression_expensive_purchases: 1,
      progression_island_puzzles: 1,
      progression_misc: 1,
      randomize_smallkeys: 2,
      randomize_bigkeys: 5,
      sword_mode: 2,
      required_bosses: 0,
      num_required_bosses: 4,
      chest_type_matches_contents: 0,
      hero_mode: 1,
      logic_obscurity: 0,
      logic_precision: 0,
      randomize_dungeon_entrances: 0,
      randomize_secret_cave_entrances: 0,
      randomize_miniboss_entrances: 0,
      randomize_boss_entrances: 0,
      randomize_secret_cave_inner_entrances: 0,
      randomize_fairy_fountain_entrances: 0,
      mix_entrances: 0,
      randomize_enemies: 0,
      randomize_starting_island: 1,
      randomize_charts: 0,
      swift_sail: 1,
      instant_text_boxes: 1,
      reveal_full_sea_chart: 1,
      add_shortcut_warps_between_dungeons: 0,
      skip_rematch_bosses: 1,
      remove_music: 0,
    };

    test("maps boolean progression options correctly", () => {
      const options = SlotDataMapper.mapToOptions(fullSlotData);

      expect(options.progression_dungeons).toBe(true);
      expect(options.progression_tingle_chests).toBe(true);
      expect(options.progression_dungeon_secrets).toBe(true);
      expect(options.progression_puzzle_secret_caves).toBe(true);
      expect(options.progression_combat_secret_caves).toBe(false);
      expect(options.progression_savage_labyrinth).toBe(false);
      expect(options.progression_great_fairies).toBe(true);
      expect(options.progression_short_sidequests).toBe(false);
      expect(options.progression_long_sidequests).toBe(false);
      expect(options.progression_spoils_trading).toBe(false);
      expect(options.progression_minigames).toBe(true);
      expect(options.progression_battlesquid).toBe(true);
      expect(options.progression_free_gifts).toBe(true);
      expect(options.progression_mail).toBe(true);
      expect(options.progression_platforms_rafts).toBe(false);
      expect(options.progression_submarines).toBe(true);
      expect(options.progression_eye_reef_chests).toBe(false);
      expect(options.progression_big_octos_gunboats).toBe(false);
      expect(options.progression_triforce_charts).toBe(false);
      expect(options.progression_treasure_charts).toBe(false);
      expect(options.progression_expensive_purchases).toBe(true);
      expect(options.progression_island_puzzles).toBe(true);
      expect(options.progression_misc).toBe(true);
    });

    test("maps other boolean options correctly", () => {
      const options = SlotDataMapper.mapToOptions(fullSlotData);

      expect(options.required_bosses).toBe(false);
      expect(options.chest_type_matches_contents).toBe(false);
      expect(options.hero_mode).toBe(true);
      expect(options.randomize_dungeon_entrances).toBe(false);
      expect(options.randomize_secret_cave_entrances).toBe(false);
      expect(options.randomize_miniboss_entrances).toBe(false);
      expect(options.randomize_boss_entrances).toBe(false);
      expect(options.randomize_secret_cave_inner_entrances).toBe(false);
      expect(options.randomize_fairy_fountain_entrances).toBe(false);
      expect(options.randomize_enemies).toBe(false);
      expect(options.randomize_starting_island).toBe(true);
      expect(options.randomize_charts).toBe(false);
      expect(options.swift_sail).toBe(true);
      expect(options.instant_text_boxes).toBe(true);
      expect(options.reveal_full_sea_chart).toBe(true);
      expect(options.add_shortcut_warps_between_dungeons).toBe(false);
      expect(options.skip_rematch_bosses).toBe(true);
      expect(options.remove_music).toBe(false);
    });

    describe("keylunacy mapping", () => {
      test("maps randomize_smallkeys = 5 to small_keylunacy true", () => {
        const options = SlotDataMapper.mapToOptions({
          ...fullSlotData,
          randomize_smallkeys: 5,
        });

        expect(options.small_keylunacy).toBe(true);
      });

      test("maps randomize_smallkeys < 5 to small_keylunacy false", () => {
        for (let i = 0; i <= 4; i++) {
          const options = SlotDataMapper.mapToOptions({
            ...fullSlotData,
            randomize_smallkeys: i,
          });

          expect(options.small_keylunacy).toBe(false);
        }
      });

      test("maps randomize_bigkeys = 5 to big_keylunacy true", () => {
        const options = SlotDataMapper.mapToOptions({
          ...fullSlotData,
          randomize_bigkeys: 5,
        });

        expect(options.big_keylunacy).toBe(true);
      });

      test("maps randomize_bigkeys < 5 to big_keylunacy false", () => {
        for (let i = 0; i <= 4; i++) {
          const options = SlotDataMapper.mapToOptions({
            ...fullSlotData,
            randomize_bigkeys: i,
          });

          expect(options.big_keylunacy).toBe(false);
        }
      });
    });

    describe("sword mode remapping", () => {
      test("maps AP 0 (start_with_sword) to Start with Hero's Sword", () => {
        const options = SlotDataMapper.mapToOptions({
          ...fullSlotData,
          sword_mode: 0,
        });

        expect(options.sword_mode).toBe("Start with Hero's Sword");
      });

      test("maps AP 1 (no_starting_sword) to No Starting Sword", () => {
        const options = SlotDataMapper.mapToOptions({
          ...fullSlotData,
          sword_mode: 1,
        });

        expect(options.sword_mode).toBe("No Starting Sword");
      });

      test("maps AP 2 (swords_optional) to Swords Optional", () => {
        const options = SlotDataMapper.mapToOptions({
          ...fullSlotData,
          sword_mode: 2,
        });

        expect(options.sword_mode).toBe("Swords Optional");
      });

      test("maps AP 3 (swordless) to Swordless", () => {
        const options = SlotDataMapper.mapToOptions({
          ...fullSlotData,
          sword_mode: 3,
        });

        expect(options.sword_mode).toBe("Swordless");
      });

      test("falls back to Start with Hero's Sword for invalid index", () => {
        const options = SlotDataMapper.mapToOptions({
          ...fullSlotData,
          sword_mode: 99,
        });

        expect(options.sword_mode).toBe("Start with Hero's Sword");
      });
    });

    describe("dropdown mappings", () => {
      test("maps logic_obscurity indices to difficulty strings", () => {
        const expected = ["None", "Normal", "Hard", "Very Hard"];

        for (let i = 0; i < expected.length; i++) {
          const options = SlotDataMapper.mapToOptions({
            ...fullSlotData,
            logic_obscurity: i,
          });

          expect(options.logic_obscurity).toBe(expected[i]);
        }
      });

      test("maps logic_precision indices to difficulty strings", () => {
        const expected = ["None", "Normal", "Hard", "Very Hard"];

        for (let i = 0; i < expected.length; i++) {
          const options = SlotDataMapper.mapToOptions({
            ...fullSlotData,
            logic_precision: i,
          });

          expect(options.logic_precision).toBe(expected[i]);
        }
      });

      test("maps mix_entrances 0 to Separate", () => {
        const options = SlotDataMapper.mapToOptions({
          ...fullSlotData,
          mix_entrances: 0,
        });

        expect(options.mix_entrances).toBe(
          "Separate Dungeons From Caves and Fountains",
        );
      });

      test("maps mix_entrances 1 to Mix", () => {
        const options = SlotDataMapper.mapToOptions({
          ...fullSlotData,
          mix_entrances: 1,
        });

        expect(options.mix_entrances).toBe(
          "Mix Dungeons and Caves and Fountains",
        );
      });

      test("maps num_required_bosses directly", () => {
        const options = SlotDataMapper.mapToOptions({
          ...fullSlotData,
          num_required_bosses: 3,
        });

        expect(options.num_required_bosses).toBe(3);
      });
    });

    test("sets default values for options not in slot_data", () => {
      const options = SlotDataMapper.mapToOptions(fullSlotData);

      expect(options.num_starting_triforce_shards).toBe(0);
      expect(options.starting_pohs).toBe(0);
      expect(options.starting_hcs).toBe(6);
      expect(options.num_extra_starting_items).toBe(0);
      expect(options.do_not_generate_spoiler_log).toBe(false);
      expect(options.trap_chests).toBe(false);
      expect(options.randomize_enemy_palettes).toBe(false);
      expect(options.hoho_hints).toBe(false);
      expect(options.fishmen_hints).toBe(false);
      expect(options.korl_hints).toBe(false);
      expect(options.num_item_hints).toBe(0);
      expect(options.num_location_hints).toBe(0);
      expect(options.num_barren_hints).toBe(0);
      expect(options.num_path_hints).toBe(0);
      expect(options.cryptic_hints).toBe(false);
      expect(options.prioritize_remote_hints).toBe(false);
      expect(options.hint_importance).toBe(false);
    });

    test("sets starting gear to all zeroes", () => {
      const options = SlotDataMapper.mapToOptions(fullSlotData);
      const startingGear = options.starting_gear;

      expect(startingGear["Bombs"]).toBe(0);
      expect(startingGear["Deku Leaf"]).toBe(0);
      expect(startingGear["Grappling Hook"]).toBe(0);
      expect(startingGear["Progressive Sword"]).toBe(0);
      expect(startingGear["Progressive Bow"]).toBe(0);
      expect(startingGear["Progressive Magic Meter"]).toBe(0);
    });

    test("sets version to master and seed_name from parameter", () => {
      const options = SlotDataMapper.mapToOptions(fullSlotData, "abc123");

      expect(options.version).toBe("master");
      expect(options.seed_name).toBe("abc123");
    });

    test("uses master as default seedName", () => {
      const options = SlotDataMapper.mapToOptions(fullSlotData);

      expect(options.version).toBe("master");
      expect(options.seed_name).toBe("master");
    });

    test("sets empty AP connection defaults", () => {
      const options = SlotDataMapper.mapToOptions(fullSlotData);

      expect(options.archipelago_link).toBe("");
      expect(options.archipelago_name).toBe("");
    });

    test("handles missing slot_data keys with defaults", () => {
      const options = SlotDataMapper.mapToOptions({});

      expect(options.progression_dungeons).toBe(false);
      expect(options.small_keylunacy).toBe(false);
      expect(options.big_keylunacy).toBe(false);
      expect(options.sword_mode).toBe("Start with Hero's Sword");
      expect(options.logic_obscurity).toBe("None");
      expect(options.logic_precision).toBe("None");
      expect(options.mix_entrances).toBe(
        "Separate Dungeons From Caves and Fountains",
      );
      expect(options.num_required_bosses).toBe(4);
    });

    test("round-trips through Permalink encode/decode", () => {
      const options = SlotDataMapper.mapToOptions(fullSlotData, "master");
      options.archipelago_link = "ws://localhost:38281";
      options.archipelago_name = "TestPlayer";

      const permalink = Permalink.encode(options);
      const decoded = Permalink.decode(permalink);

      expect(decoded.progression_dungeons).toBe(true);
      expect(decoded.progression_combat_secret_caves).toBe(false);
      expect(decoded.small_keylunacy).toBe(false);
      expect(decoded.big_keylunacy).toBe(true);
      expect(decoded.sword_mode).toBe("Swords Optional");
      expect(decoded.logic_obscurity).toBe("None");
      expect(decoded.required_bosses).toBe(false);
      expect(decoded.hero_mode).toBe(true);
      expect(decoded.skip_rematch_bosses).toBe(true);
      expect(decoded.num_required_bosses).toBe(4);
      expect(decoded.archipelago_link).toBe("ws://localhost:38281");
      expect(decoded.archipelago_name).toBe("TestPlayer");
    });
  });
});
