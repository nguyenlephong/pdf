import React from 'react';
import {TextField, TextFieldProps} from '@mui/material';
import {IS_PREVENT_INPUT, MAX_CHAR_NUMBER} from "@/modules/docs-setting/pdf/pdf.conf";

interface NumericInputProps extends Omit<TextFieldProps, 'onChange'> {
  value: string | number;
  onChange: (value: number) => void;
}

const NumericInput: React.FC<NumericInputProps> = (props) => {
  const {
    value,
    onChange,
    ...textFieldProps
  } = props;
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!IS_PREVENT_INPUT) return;
    const paste = e.clipboardData.getData("text").trim();
    
    // ❌ Not digits only
    if (!/^\d+$/.test(paste)) {
      e.preventDefault();
      return;
    }
    
    // ❌ Too long to be a safe JS integer (max 16 digits)
    if (paste.length > 16) {
      e.preventDefault();
      return;
    }
    
    if (MAX_CHAR_NUMBER) {
      // ❌ Too large for safe integer
      const num = Number(paste);
      if (!Number.isFinite(num) || num > MAX_CHAR_NUMBER) {
        e.preventDefault();
      }
    }
  };
  
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    
    if (MAX_CHAR_NUMBER && IS_PREVENT_INPUT) {
      if (val.length > 16) {
        e.preventDefault();
      }
      
      if (Number(val) > MAX_CHAR_NUMBER) {
        e.preventDefault();
        return;
      }
    }
    
    onChange(Number(val));
  };
  
  return (
    <TextField
      {...textFieldProps}
      value={value}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onChange={handleChange}
      inputProps={{
        min: 1,
        max: MAX_CHAR_NUMBER,
        inputMode: 'numeric',
        pattern: '[0-9]*',
        ...(textFieldProps.inputProps || {}),
      }}
    />
  );
};

export default NumericInput;
