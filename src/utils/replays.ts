export const parseReplayData = (rawReplayData: any) => {
  if (rawReplayData.steps) {
    // kaggle replay
    const commands = [];
    rawReplayData.steps.forEach((stepInfo) => {
      stepInfo.forEach(
        (step: { action: string[]; observation: { player: number } }) => {
          let mappedActions = step.action.map((action) => {
            return { command: action, agentId: step.observation.player };
          });
          commands.push(mappedActions);
        }
      );
    });
    const seed = 0;

    const replay = {
      seed,
      allCommands: commands,
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
    return replay;
  } else {
    return rawReplayData;
  }
};
