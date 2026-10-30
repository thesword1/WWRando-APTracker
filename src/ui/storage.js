import _ from 'lodash';

export default class Storage {
  static async loadFileAndStore() {
    const file = await this.#loadFileFromDialog();
    const fileData = await this.#readFile(file);

    localStorage.setItem(this.#SAVE_FILE_KEY, fileData);
  }

  static async loadTextFile(accept) {
    const file = await this.#loadFileFromDialog(accept);
    const contents = await this.#readFile(file);

    return { contents, name: file.name };
  }

  static loadFromStorage() {
    return localStorage.getItem(this.#SAVE_FILE_KEY);
  }

  static saveToStorage(saveData) {
    localStorage.setItem(this.#SAVE_FILE_KEY, saveData);
  }

  static loadPreferences() {
    const preferencesString = localStorage.getItem(this.#PREFERENCES_KEY);
    return JSON.parse(preferencesString);
  }

  static savePreferences(preferences) {
    const preferencesString = JSON.stringify(preferences);
    localStorage.setItem(this.#PREFERENCES_KEY, preferencesString);
  }

  static loadExcludedLocations(seedName, playerName) {
    const excludedString = localStorage.getItem(this.#EXCLUDED_LOCATIONS_KEY);
    const excluded = JSON.parse(excludedString);

    if (
      _.isNil(excluded)
      || excluded.seedName !== seedName
      || excluded.playerName !== playerName
    ) {
      return [];
    }

    return excluded.locations;
  }

  static saveExcludedLocations(seedName, playerName, locations) {
    const excludedString = JSON.stringify({ seedName, playerName, locations });
    localStorage.setItem(this.#EXCLUDED_LOCATIONS_KEY, excludedString);
  }

  static clearExcludedLocations() {
    localStorage.removeItem(this.#EXCLUDED_LOCATIONS_KEY);
  }

  static async exportFile(saveData) {
    const blob = new Blob([saveData], { type: 'application/json' });
    const url = await URL.createObjectURL(blob);

    try {
      const element = document.createElement('a');

      element.setAttribute('href', url);
      element.setAttribute('download', this.#EXPORT_FILE_NAME);
      element.style.display = 'none';

      document.body.appendChild(element);

      try {
        element.click();
      } finally {
        document.body.removeChild(element);
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  static #SAVE_FILE_KEY = 'saveData';

  static #EXPORT_FILE_NAME = 'tww_rando_tracker_progress.json';

  static #PREFERENCES_KEY = 'preferences';

  static #EXCLUDED_LOCATIONS_KEY = 'excludedLocations';

  static async #loadFileFromDialog(accept) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');

      input.setAttribute('type', 'file');
      if (!_.isNil(accept)) {
        input.setAttribute('accept', accept);
      }

      input.onchange = () => {
        const file = _.first(input.files);

        if (_.isNil(file)) {
          reject();
          return;
        }

        resolve(file);
      };

      input.click();
    });
  }

  static async #readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const contents = reader.result;

        if (_.isNil(contents)) {
          reject();
          return;
        }

        resolve(contents);
      };

      reader.readAsText(file);
    });
  }
}
