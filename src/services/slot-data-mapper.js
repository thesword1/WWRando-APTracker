import _ from "lodash";

import LOGIC_DIFFICULTY_OPTIONS from "../data/logic-difficulty-options.json";
import MIX_ENTRANCES_OPTIONS from "../data/mix-entrances-options.json";
import PROGRESSIVE_STARTING_ITEMS from "../data/progressive-starting-items.json";
import REGULAR_STARTING_ITEMS from "../data/regular-starting-items.json";
import SWORD_MODE_OPTIONS from "../data/sword-mode-options.json";

import Permalink from "./permalink";

class SlotDataMapper {
  // AP sword_mode enum:  0=start_with_sword, 1=no_starting_sword, 2=swords_optional, 3=swordless
  // Our tracker indices: 0="Start with Hero's Sword", 1="No Starting Sword", 2="Swordless", 3="Swords Optional"
  // AP indices 2 and 3 are swapped relative to ours.
  static #AP_SWORD_MODE_MAP = [
    SWORD_MODE_OPTIONS[0], // AP 0 -> "Start with Hero's Sword"
    SWORD_MODE_OPTIONS[1], // AP 1 -> "No Starting Sword"
    SWORD_MODE_OPTIONS[3], // AP 2 (swords_optional) -> "Swords Optional" (our index 3)
    SWORD_MODE_OPTIONS[2], // AP 3 (swordless) -> "Swordless" (our index 2)
  ];

  static #BOOLEAN_SLOT_KEYS = [
    "progression_dungeons",
    "progression_tingle_chests",
    "progression_dungeon_secrets",
    "progression_puzzle_secret_caves",
    "progression_combat_secret_caves",
    "progression_savage_labyrinth",
    "progression_great_fairies",
    "progression_short_sidequests",
    "progression_long_sidequests",
    "progression_spoils_trading",
    "progression_minigames",
    "progression_battlesquid",
    "progression_free_gifts",
    "progression_mail",
    "progression_platforms_rafts",
    "progression_submarines",
    "progression_eye_reef_chests",
    "progression_big_octos_gunboats",
    "progression_triforce_charts",
    "progression_treasure_charts",
    "progression_expensive_purchases",
    "progression_island_puzzles",
    "progression_misc",
    "required_bosses",
    "chest_type_matches_contents",
    "hero_mode",
    "randomize_dungeon_entrances",
    "randomize_secret_cave_entrances",
    "randomize_miniboss_entrances",
    "randomize_boss_entrances",
    "randomize_secret_cave_inner_entrances",
    "randomize_fairy_fountain_entrances",
    "randomize_enemies",
    "randomize_starting_island",
    "randomize_charts",
    "swift_sail",
    "instant_text_boxes",
    "reveal_full_sea_chart",
    "add_shortcut_warps_between_dungeons",
    "skip_rematch_bosses",
    "remove_music",
  ];

  static mapToOptions(slotData, seedName = "master") {
    const options = {};

    // Metadata — version must be a valid Git ref for LogicLoader's GitHub URL
    _.set(options, Permalink.OPTIONS.VERSION, "master");
    _.set(options, Permalink.OPTIONS.SEED_NAME, seedName);

    // Boolean options: slot_data 0/1 -> true/false
    _.forEach(this.#BOOLEAN_SLOT_KEYS, (slotKey) => {
      _.set(options, slotKey, _.get(slotData, slotKey, 0) === 1);
    });

    // Keylunacy: randomize_smallkeys/bigkeys value 5 = keylunacy
    _.set(
      options,
      Permalink.OPTIONS.SMALL_KEYLUNACY,
      _.get(slotData, "randomize_smallkeys", 0) === 5,
    );
    _.set(
      options,
      Permalink.OPTIONS.BIG_KEYLUNACY,
      _.get(slotData, "randomize_bigkeys", 0) === 5,
    );

    // Sword mode (index remapping: AP 2↔3 swapped with ours)
    const swordModeIndex = _.get(slotData, "sword_mode", 0);
    _.set(
      options,
      Permalink.OPTIONS.SWORD_MODE,
      this.#AP_SWORD_MODE_MAP[swordModeIndex] || SWORD_MODE_OPTIONS[0],
    );

    // Logic difficulty (indices match directly)
    _.set(
      options,
      Permalink.OPTIONS.LOGIC_OBSCURITY,
      LOGIC_DIFFICULTY_OPTIONS[_.get(slotData, "logic_obscurity", 0)] ||
        LOGIC_DIFFICULTY_OPTIONS[0],
    );
    _.set(
      options,
      Permalink.OPTIONS.LOGIC_PRECISION,
      LOGIC_DIFFICULTY_OPTIONS[_.get(slotData, "logic_precision", 0)] ||
        LOGIC_DIFFICULTY_OPTIONS[0],
    );

    // Mix entrances (indices match directly)
    _.set(
      options,
      Permalink.OPTIONS.MIX_ENTRANCES,
      MIX_ENTRANCES_OPTIONS[_.get(slotData, "mix_entrances", 0)] ||
        MIX_ENTRANCES_OPTIONS[0],
    );

    // Num required bosses (direct integer)
    _.set(
      options,
      Permalink.OPTIONS.NUM_REQUIRED_BOSSES,
      _.get(slotData, "num_required_bosses", 4),
    );

    // Options not in slot_data: sensible defaults
    _.set(options, Permalink.OPTIONS.NUM_STARTING_TRIFORCE_SHARDS, 0);
    _.set(options, Permalink.OPTIONS.STARTING_POHS, 0);
    _.set(options, Permalink.OPTIONS.STARTING_HCS, 6);
    _.set(options, Permalink.OPTIONS.NUM_EXTRA_STARTING_ITEMS, 0);
    _.set(options, Permalink.OPTIONS.DO_NOT_GENERATE_SPOILER_LOG, false);
    _.set(options, Permalink.OPTIONS.TRAP_CHESTS, false);
    _.set(options, Permalink.OPTIONS.RANDOMIZE_ENEMY_PALETTES, false);
    _.set(options, Permalink.OPTIONS.HOHO_HINTS, false);
    _.set(options, Permalink.OPTIONS.FISHMEN_HINTS, false);
    _.set(options, Permalink.OPTIONS.KORL_HINTS, false);
    _.set(options, Permalink.OPTIONS.NUM_ITEM_HINTS, 0);
    _.set(options, Permalink.OPTIONS.NUM_LOCATION_HINTS, 0);
    _.set(options, Permalink.OPTIONS.NUM_BARREN_HINTS, 0);
    _.set(options, Permalink.OPTIONS.NUM_PATH_HINTS, 0);
    _.set(options, Permalink.OPTIONS.CRYPTIC_HINTS, false);
    _.set(options, Permalink.OPTIONS.PRIORITIZE_REMOTE_HINTS, false);
    _.set(options, Permalink.OPTIONS.HINT_IMPORTANCE, false);

    // Starting gear: all zeroes (AP delivers starting items via precollected items)
    const startingGear = {};
    _.forEach(REGULAR_STARTING_ITEMS, (item) => {
      startingGear[item] = 0;
    });
    _.forEach(PROGRESSIVE_STARTING_ITEMS, (item) => {
      startingGear[item] = 0;
    });
    _.set(options, Permalink.OPTIONS.STARTING_GEAR, startingGear);

    // AP connection info defaults (caller should override these)
    _.set(options, Permalink.OPTIONS.ARCHIPELAGO_LINK, "");
    _.set(options, Permalink.OPTIONS.ARCHIPELAGO_NAME, "");
    _.set(options, Permalink.OPTIONS.ARCHIPELAGO_PASSWORD, "");

    return options;
  }
}

export default SlotDataMapper;
