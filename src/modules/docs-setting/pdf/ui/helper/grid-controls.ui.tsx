import {Box, Checkbox, FormControlLabel, TextField, Typography} from '@mui/material';
import React from "react";

interface GridControlsProps {
  snapToGrid: boolean;
  setSnapToGrid: (checked: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
}

const GridControls: React.FC<GridControlsProps> = (props) => {
  const {
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
  } = props
  return (
    <Box display="flex" alignItems="center" gap={1.5}>
      {/* Checkbox for Snap to Grid */}
      <FormControlLabel
        control={
          <Checkbox
            checked={snapToGrid}
            onChange={(e) => setSnapToGrid(e.target.checked)}
            size="small"
          />
        }
        label={<Typography variant="body2">Snap to Grid</Typography>}
      />
      
      {/* Grid Size input, visible only when snapToGrid is true */}
      {snapToGrid && (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2">Size:</Typography>
          <TextField
            type="number"
            value={gridSize}
            onChange={(e) => setGridSize(Math.max(5, parseInt(e.target.value) || 10))}
            inputProps={{
              min: 5,
              max: 50,
              style: {textAlign: 'center', fontSize: 12},
            }}
            size="small"
            sx={{width: 70}}
          />
        </Box>
      )}
    </Box>
  );
};

export default GridControls;