import React from 'react';
import ZoomIn from './zoomin.svg';
import ZoomOut from './zoomout.svg';
import './styles.css';
import { Button, IconButton } from '@material-ui/core';
type ZoomInOutProps = {
  className: string;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
};
const ZoomInOut = ({
  className,
  handleZoomIn,
  handleZoomOut,
}: ZoomInOutProps) => {
  return (
    <div className={`${className} ZoomInOut`}>
      <IconButton className="zoomin" onClick={handleZoomIn}>
        <img src={ZoomIn} />
      </IconButton>
      <IconButton className="zoomout" onClick={handleZoomOut}>
        <img src={ZoomOut} />
      </IconButton>
    </div>
  );
};
export default ZoomInOut;
