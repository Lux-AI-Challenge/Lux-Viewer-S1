export const parseReplayData = (rawReplayData: any) => {
  if (rawReplayData.steps) {
    // kaggle replay
    const commands = [];
    rawReplayData.steps.forEach((stepInfo) => {
      let turnCommands = [];
      stepInfo.forEach(
        (step: { action: string[]; observation: { player: number } }) => {
          let mappedActions = step.action.map((action) => {
            return { command: action, agentID: step.observation.player };
          });
          turnCommands.push(...mappedActions);
        }
      );
      commands.push(turnCommands);
    });
    const replay = {
      allCommands: commands.slice(1), // slice 1 to remove empty first entry that represents the "observation"
      mapType: rawReplayData.configuration.mapType,
      seed: parseInt(rawReplayData.configuration.seed),
      teamDetails: [
        {
          name: 'team-1',
          tournamentID: '',
        },
        {
          name: 'team-2',
          tournamentID: '',
        },
      ],
    };
    console.log('PARSED REPLAY', replay);
    return replay;
  } else {
    return rawReplayData;
  }
};
