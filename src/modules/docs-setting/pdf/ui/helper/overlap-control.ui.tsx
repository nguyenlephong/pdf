import React from "react";
import {Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Typography} from "@mui/material";

type DragOverlapBehavior = 'snap' | 'return';

interface OverlapControlProps {
  dragOverlapBehavior: DragOverlapBehavior;
  setDragOverlapBehavior: (value: DragOverlapBehavior) => void;
}

const OverlapControl: React.FC<OverlapControlProps> = (props) => {
  const {
    dragOverlapBehavior,
    setDragOverlapBehavior,
  } = props
  const handleChange = (e: SelectChangeEvent<DragOverlapBehavior>) => {
    setDragOverlapBehavior(e.target.value as DragOverlapBehavior);
  };
  
  return (
    <Box display="flex" alignItems="center" gap={1.5}>
      <Typography variant="body2">On Overlap:</Typography>
      
      <FormControl size="small" sx={{minWidth: 180}}>
        <InputLabel id="overlap-select-label">Behavior</InputLabel>
        <Select
          labelId="overlap-select-label"
          value={dragOverlapBehavior}
          label="Behavior"
          onChange={handleChange}
        >
          <MenuItem value="snap">Snap to Side</MenuItem>
          <MenuItem value="return">Return to Original</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default OverlapControl;