import React from 'react';
import './styles.css';
import { FrameSingleCityData } from '../../scenes/MainScene';
import Team0WorkerSVG from '../../icons/city00.svg';
import Team1WorkerSVG from '../../icons/city10.svg';
import { makeStyles } from '@material-ui/core';
export type CityStatsCardProps = FrameSingleCityData & { cityid: string };

const useStyles = makeStyles({
  progressa: {
    backgroundColor: 'orange',
  },
  progressb: {
    backgroundColor: 'blue',
  },
});
const CityStatsCard = ({
  team,
  fuel,
  cityid,
  cityTilePositions,
  upkeep,
}: CityStatsCardProps) => {
  const classes = useStyles();
  const renderCitySVG = () => {
    let svg = Team1WorkerSVG;
    if (team === 0) {
      svg = Team0WorkerSVG;
    }
    return <img src={svg} />;
  };
  return (
    <div className="CityStatsCard">
      <div className="city-id">
        <strong>ID:</strong> {cityid}
      </div>
      <div className="worker-icon-wrapper">{renderCitySVG()}</div>
      <div className="worker-data">
        <p>
          {/* <strong>Pos:</strong>{' '}
          <span>
            ({pos.x}, {pos.y})
          </span> */}
        </p>
        <p>
          <strong>Size: </strong>
          <span>{cityTilePositions.length}</span>
        </p>
        <p>
          <strong>Fuel Upkeep: </strong>
          <span>{upkeep}</span>
        </p>
        <p>
          <strong>Fuel: </strong>
          <span>{fuel}</span>
        </p>
        {/* <p>
          <strong>Wood:</strong> <span>{cargo.wood}</span>
        </p>
        <p>
          <strong>Coal:</strong> <span>{cargo.coal}</span>
        </p>
        <p>
          <strong>Uranium:</strong> <span>{cargo.uranium}</span>
        </p> */}
      </div>
    </div>
  );
};
export default CityStatsCard;
