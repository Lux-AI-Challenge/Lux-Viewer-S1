import React from 'react';
import './styles.css';
const LuxCard = ({
  children,
  title,
}: {
  children?: React.ReactNode;
  title?: string;
}) => {
  return (
    <div className="LuxCard">
      {title && <h3 className="title">{title}</h3>}
      <div className="content">{children}</div>
    </div>
  );
};
export default LuxCard;
