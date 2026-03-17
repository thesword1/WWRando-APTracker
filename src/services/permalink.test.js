import Permalink from "./permalink";

describe("Permalink", () => {
  describe("OPTIONS", () => {
    test("returns the correct options", () => {
      expect(Permalink.OPTIONS).toMatchSnapshot();
    });
  });

  describe("MIX_ENTRANCES_OPTIONS", () => {
    test("returns the correct options", () => {
      expect(Permalink.MIX_ENTRANCES_OPTIONS).toMatchSnapshot();
    });
  });

  describe("SWORD_MODE_OPTIONS", () => {
    test("returns the correct options", () => {
      expect(Permalink.SWORD_MODE_OPTIONS).toMatchSnapshot();
    });
  });

  describe("DROPDOWN_OPTIONS", () => {
    test("returns the correct dropdown options", () => {
      expect(Permalink.DROPDOWN_OPTIONS).toMatchSnapshot();
    });
  });

  describe("DEFAULT_PERMALINK", () => {
    test("returns the default options", () => {
      const options = Permalink.decode(Permalink.DEFAULT_PERMALINK);

      expect(options).toMatchSnapshot();
    });
  });

  describe("decode", () => {
    test("decodes a permalink", () => {
      const options = Permalink.decode(
        "bWFzdGVyAEEASRBQMAAA9gWQSwAAAAAAAgAAAABBkRtdmRwIU5rbGkCRG12ZHEgQFAgUW1hemRyIU1hbGQAA",
      );

      expect(options).toMatchSnapshot();
    });

    test("throws errors for invalid permalinks", () => {
      expect(() => Permalink.decode("")).toThrow();
      expect(() => Permalink.decode("H")).toThrow();
      expect(() => Permalink.decode("AAAA")).toThrow();
      expect(() => Permalink.decode("BBBBBBBBBBBBBBBBBBBBBBB")).toThrow();
      expect(() =>
        Permalink.decode("MS4xMC4wAHllZXQfwijoi1+gIAHEAAAABAAgiAZAA=="),
      ).toThrow();
      expect(() => Permalink.decode("VIOEWJAFOEIWAJVEOWAIVJN")).toThrow();
      expect(() =>
        Permalink.decode("vdsccccccccccccccccccccccccccccccccc"),
      ).toThrow();
      expect(() =>
        Permalink.decode("AAAAAAAHHHHHHHHHHHHHHHHHHHHHHHHHHHHH"),
      ).toThrow();
      expect(() =>
        Permalink.decode("abcdefghijklmnopqrstuvwxyzABCDEFGHIJ"),
      ).toThrow();
      expect(() =>
        Permalink.decode("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"),
      ).toThrow();
    });
  });

  describe("encode", () => {
    let options;
    let permalink;

    beforeEach(() => {
      permalink =
        "bWFzdGVyAEEASRBQMAAA9gWQSwAAAAAAAgAAAABBkRtdmRwIU5rbGkCRG12ZHEgQFAgUW1hemRyIU1hbGQAA";
      options = {
        add_shortcut_warps_between_dungeons: false,
        chest_type_matches_contents: false,
        cryptic_hints: true,
        do_not_generate_spoiler_log: false,
        fishmen_hints: true,
        hero_mode: false,
        hint_importance: false,
        hoho_hints: true,
        instant_text_boxes: true,
        small_keylunacy: false,
        big_keylunacy: false,
        korl_hints: false,
        logic_obscurity: "None",
        logic_precision: "None",
        mix_entrances: "Separate Dungeons From Caves and Fountains",
        num_barren_hints: 0,
        num_extra_starting_items: 0,
        num_item_hints: 15,
        num_location_hints: 5,
        num_path_hints: 0,
        num_required_bosses: 4,
        num_starting_triforce_shards: 0,
        prioritize_remote_hints: false,
        progression_battlesquid: false,
        progression_big_octos_gunboats: false,
        progression_combat_secret_caves: false,
        progression_dungeon_secrets: false,
        progression_dungeons: true,
        progression_expensive_purchases: true,
        progression_eye_reef_chests: false,
        progression_free_gifts: true,
        progression_great_fairies: true,
        progression_island_puzzles: false,
        progression_long_sidequests: false,
        progression_mail: false,
        progression_minigames: false,
        progression_misc: true,
        progression_platforms_rafts: false,
        progression_puzzle_secret_caves: true,
        progression_savage_labyrinth: false,
        progression_short_sidequests: false,
        progression_spoils_trading: false,
        progression_submarines: false,
        progression_tingle_chests: false,
        progression_treasure_charts: false,
        progression_triforce_charts: false,
        randomize_boss_entrances: false,
        randomize_charts: false,
        randomize_dungeon_entrances: false,
        randomize_enemies: false,
        randomize_enemy_palettes: false,
        randomize_fairy_fountain_entrances: false,
        randomize_miniboss_entrances: false,
        randomize_secret_cave_entrances: false,
        randomize_secret_cave_inner_entrances: false,
        randomize_starting_island: false,
        remove_music: false,
        required_bosses: false,
        reveal_full_sea_chart: true,
        seed_name: "A",
        skip_rematch_bosses: true,
        starting_gear: {
          "Bait Bag": 0,
          "Ballad of Gales": 1,
          "Beedle's Chart": 0,
          Bombs: 0,
          Boomerang: 0,
          "Cabana Deed": 0,
          "Command Melody": 0,
          "DRC Compass": 0,
          "DRC Dungeon Map": 0,
          "Deku Leaf": 0,
          "Delivery Bag": 0,
          "Din's Pearl": 0,
          "Dragon Tingle Statue": 0,
          "ET Compass": 0,
          "ET Dungeon Map": 0,
          "Earth God's Lyric": 0,
          "Earth Tingle Statue": 0,
          "Empty Bottle": 0,
          "FF Compass": 0,
          "FF Dungeon Map": 0,
          "FW Compass": 0,
          "FW Dungeon Map": 0,
          "Farore's Pearl": 0,
          "Fill-Up Coupon": 0,
          "Forbidden Tingle Statue": 0,
          "Ghost Ship Chart": 0,
          "Goddess Tingle Statue": 0,
          "Grappling Hook": 0,
          "Great Fairy Chart": 0,
          "Hero's Charm": 0,
          Hookshot: 0,
          "Hurricane Spin": 0,
          "Iron Boots": 0,
          "Light Ring Chart": 0,
          "Maggie's Letter": 0,
          "Magic Armor": 0,
          "Moblin's Letter": 0,
          "Nayru's Pearl": 0,
          "Note to Mom": 0,
          "Octo Chart": 0,
          "Platform Chart": 0,
          "Power Bracelets": 0,
          "Progressive Bomb Bag": 0,
          "Progressive Bow": 0,
          "Progressive Magic Meter": 0,
          "Progressive Picto Box": 0,
          "Progressive Quiver": 0,
          "Progressive Shield": 0,
          "Progressive Sword": 0,
          "Progressive Wallet": 0,
          "Secret Cave Chart": 0,
          "Skull Hammer": 0,
          "Song of Passing": 1,
          "Spoils Bag": 0,
          "Submarine Chart": 0,
          Telescope: 0,
          "Tingle Tuner": 0,
          "Tingle's Chart": 0,
          "TotG Compass": 0,
          "TotG Dungeon Map": 0,
          "WT Compass": 0,
          "WT Dungeon Map": 0,
          "Wind God's Aria": 0,
          "Wind Tingle Statue": 0,
        },
        starting_hcs: 3,
        starting_pohs: 0,
        swift_sail: true,
        sword_mode: "Start with Hero's Sword",
        trap_chests: false,
        version: "master",
        archipelago_link: "Enter Link",
        archipelago_name: "Enter AP Player Name",
        archipelago_password: "",
      };
    });

    test("encodes a permalink", () => {
      const encodedPermalink = Permalink.encode(options);

      expect(encodedPermalink).toEqual(permalink);
    });
  });
});
