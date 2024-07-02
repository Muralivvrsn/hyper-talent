import React, { useState } from 'react';

function NameCheck({ token, sheetId, sheetName, columnName }) {
  const [name, setName] = useState('');
  const [exists, setExists] = useState(null);

  const checkName = () => {
    fetch('https://hypertalent-server.onrender.com/check-name', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ sheetId, sheetName, columnName, name })
    })
    .then(response => response.json())
    .then(data => {
      setExists(data.nameExists);
    })
    .catch(error => {
      console.error('Error checking name', error);
    });
  };

  return (
    <div>
      <h3>Check Name</h3>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Enter name to check..."
      />
      <button onClick={checkName}>Check</button>
      {exists !== null && (
        <p>{exists ? 'Name exists in the column' : 'Name does not exist in the column'}</p>
      )}
    </div>
  );
}

export default NameCheck;