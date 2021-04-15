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
    const seed = 0;

    const replay = {
      seed,
      allCommands: commands.slice(1), // slice 1 to remove empty first entry that represents the "observation"
      mapType: 'debug',
      width: 16,
      height: 16,
      teamDetails: [
        {
          name: 'spambot',
          tournamentID: '',
        },
        {
          name: 'better',
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
