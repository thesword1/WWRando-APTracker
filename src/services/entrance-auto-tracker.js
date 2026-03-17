import STAGE_TO_EXIT from "../data/stage-to-exit-mapping.json";

export function computeEntranceMappings(
  visitedStages,
  reversePairings,
  randomEntranceSet,
  processedStages,
  trackerState,
) {
  const mappings = [];

  for (const stageName of Object.keys(visitedStages)) {
    if (processedStages.has(stageName)) continue;

    const exitInternalName = STAGE_TO_EXIT[stageName];
    if (!exitInternalName) continue;

    const entranceInternalName = reversePairings[exitInternalName];
    if (!entranceInternalName) continue;

    if (!randomEntranceSet.has(entranceInternalName)) continue;

    if (trackerState.isEntranceChecked(entranceInternalName)) {
      processedStages.add(stageName);
      continue;
    }

    mappings.push({ entranceInternalName, exitInternalName, stageName });
    processedStages.add(stageName);
  }

  return mappings;
}
