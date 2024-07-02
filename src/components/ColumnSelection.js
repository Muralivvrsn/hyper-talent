import React from 'react';

function ColumnSelection({ columns, onSelectColumn }) {
  return (
    <div>
      <h3>Select a Column</h3>
      <ul>
        {columns.map((col, index) => (
          <li key={index} onClick={() => onSelectColumn(col)}>{col}</li>
        ))}
      </ul>
    </div>
  );
}

export default ColumnSelection;