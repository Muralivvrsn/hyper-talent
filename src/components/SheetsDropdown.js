import React, { useEffect, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { styled } from '@mui/system';

const CustomTextField = styled(TextField)({
  '& .MuiInputBase-input': {
    fontSize: '23px',
  },
  '& .MuiFormLabel-root': {
    fontSize: '23px',
  }
});

function SheetsDropdown({ token, onSelectSheet }) {
  const [spreadsheets, setSpreadsheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://hypertalent-server.onrender.com/sheets/list-spreadsheets', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log(data)
      setSpreadsheets(data);
      setLoading(false);
    })
    .catch(error => {
      console.error('Error fetching spreadsheets', error);
      setLoading(false);
    });
  }, [token]);

  const options = spreadsheets.map(spreadsheet => ({
    value: spreadsheet.id,
    label: spreadsheet.name
  }));

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option) => option.label}
      onChange={(event, newValue) => {
        onSelectSheet(newValue ? newValue.value : null);
      }}
      renderInput={(params) => <CustomTextField {...params} label="Select a spreadsheet" variant="outlined" />}
    />
  );
}

export default SheetsDropdown;