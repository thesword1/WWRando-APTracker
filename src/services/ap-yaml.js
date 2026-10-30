import yaml from "js-yaml";
import _ from "lodash";

class ApYaml {
  static #GAME_NAME = "The Wind Waker";

  // AP replaces these in player names when the game is generated.
  // The uppercase versions are left blank for the first player.
  static #NAME_PLACEHOLDERS = {
    "{number}": "\\d+",
    "{player}": "\\d+",
    "{NUMBER}": "(?:\\d+)?",
    "{PLAYER}": "(?:\\d+)?",
  };

  static getExcludedLocations(yamlText, playerName) {
    let documents;
    try {
      documents = yaml.loadAll(yamlText);
    } catch (err) {
      throw new Error("The file is not valid YAML.");
    }

    const matchingPlayers = _.filter(
      documents,
      (document) => _.isPlainObject(document) && this.#nameMatches(document.name, playerName),
    );
    if (_.isEmpty(matchingPlayers)) {
      throw new Error(`The file has no player named "${playerName}".`);
    }

    const player = _.find(matchingPlayers, (document) => document.game === this.#GAME_NAME);
    if (_.isNil(player)) {
      throw new Error(`The player "${playerName}" is not playing "${this.#GAME_NAME}".`);
    }

    const gameOptions = player[this.#GAME_NAME];
    if (!_.isPlainObject(gameOptions)) {
      throw new Error(`The player has no "${this.#GAME_NAME}" section.`);
    }

    const excludedLocations = _.get(gameOptions, "exclude_locations");
    if (_.isNil(excludedLocations)) {
      return [];
    }
    if (!_.isArray(excludedLocations) || !_.every(excludedLocations, _.isString)) {
      throw new Error("exclude_locations must be a list of location names.");
    }

    return excludedLocations;
  }

  static #nameMatches(yamlName, playerName) {
    if (_.isNil(yamlName)) {
      return false;
    }

    const pattern = _.map(
      _.toString(yamlName).split(/(\{number\}|\{player\}|\{NUMBER\}|\{PLAYER\})/),
      (part) => _.get(this.#NAME_PLACEHOLDERS, part, _.escapeRegExp(part)),
    ).join("");

    return new RegExp(`^${pattern}$`).test(playerName);
  }
}

export default ApYaml;
