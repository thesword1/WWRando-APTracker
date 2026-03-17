import PropTypes from "prop-types";
import React from "react";

import LogicHelper from "../services/logic-helper";

class Buttons extends React.PureComponent {
  render() {
    const {
      chartListOpen,
      settingsWindowOpen,
      showHintPanel,
      showInfoLegend,
      toggleChartList,
      toggleHintPanel,
      toggleInfoLegend,
      toggleSettingsWindow,
      toggleEntrances,
      trackNonProgressCharts,
      viewingEntrances,
    } = this.props;

    const settingsWindowText = settingsWindowOpen
      ? "Close Settings"
      : "Open Settings";
    const chartListText = chartListOpen ? "Close Chart List" : "View Charts";
    const hintPanelText = showHintPanel ? "Close Hints" : "View Hints";
    const infoLegendText = showInfoLegend ? "Close Info" : "Info";
    const isRandomEntrances = LogicHelper.isRandomEntrances();
    const showChartsButton =
      trackNonProgressCharts || LogicHelper.anyProgressItemCharts();

    return (
      <div className="buttons">
        {isRandomEntrances && (
          <button onClick={toggleEntrances} type="button">
            <input
              type="radio"
              className="button-radio"
              checked={viewingEntrances}
              readOnly
            />
            View Entrances
            <input
              type="radio"
              className="button-radio second-button-radio"
              checked={!viewingEntrances}
              readOnly
            />
            View Exits
          </button>
        )}
        {showChartsButton && (
          <button onClick={toggleChartList} type="button">
            {chartListText}
          </button>
        )}
        <button onClick={toggleSettingsWindow} type="button">
          {settingsWindowText}
        </button>
        <button onClick={toggleHintPanel} type="button">
          {hintPanelText}
        </button>
        <button onClick={toggleInfoLegend} type="button">
          {infoLegendText}
        </button>
      </div>
    );
  }
}

Buttons.propTypes = {
  chartListOpen: PropTypes.bool.isRequired,
  settingsWindowOpen: PropTypes.bool.isRequired,
  showHintPanel: PropTypes.bool.isRequired,
  showInfoLegend: PropTypes.bool.isRequired,
  toggleChartList: PropTypes.func.isRequired,
  toggleEntrances: PropTypes.func.isRequired,
  toggleHintPanel: PropTypes.func.isRequired,
  toggleInfoLegend: PropTypes.func.isRequired,
  toggleSettingsWindow: PropTypes.func.isRequired,
  trackNonProgressCharts: PropTypes.bool.isRequired,
  viewingEntrances: PropTypes.bool.isRequired,
};

export default Buttons;
