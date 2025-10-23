import React, {useState} from "react";
import {Box, Divider, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField, Button} from "@mui/material";

type ItemConfProps = {
  onSaveSetting: (data: any) => void;
  data: any
}
const FreeTextForm: React.FC<ItemConfProps> = (props) => {
  const {data, onSaveSetting} = props;
  const [answerType, setAnswerType] = useState("min");
  const [title, setTitle] = useState("");
  const [minChar, setMinChar] = useState("");
  const [maxChar, setMaxChar] = useState("");
  const [confirmType, setConfirmType] = useState("number");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleSave = () => {
    const errs: Record<string, string> = {};
    
    // validate title
    if (!title.trim()) errs.title = "Vui lòng nhập tiêu đề";
    if (title.length > 400) errs.title = "Tựa đề không được vượt quá 400 ký tự";
    
    // validate theo answerType
    const numMin = parseInt(minChar);
    const numMax = parseInt(maxChar);
    const vMin = parseInt(minValue);
    const vMax = parseInt(maxValue);
    
    const checkPositive = (val: string) => /^\d+$/.test(val) && Number(val) > 0;
    
    if (answerType === "min" && !checkPositive(minChar))
      errs.minChar = "Vui lòng nhập số ký tự tối thiểu";
    
    if (answerType === "max" && !checkPositive(maxChar))
      errs.maxChar = "Vui lòng nhập số ký tự tối đa";
    
    if (answerType === "exact") {
      if (!checkPositive(minChar)) errs.minChar = "Vui lòng nhập số ký tự tối thiểu";
      if (!checkPositive(maxChar)) errs.maxChar = "Vui lòng nhập số ký tự tối đa";
      if (checkPositive(minChar) && checkPositive(maxChar) && numMax <= numMin)
        errs.maxChar = "Ký tự tối đa phải lớn hơn ký tự tối thiểu";
    }
    
    if (answerType === "confirm" && confirmType === "number") {
      if (minValue && !checkPositive(minValue)) errs.minValue = "Giá trị nhỏ nhất phải > 0";
      if (maxValue && !checkPositive(maxValue)) errs.maxValue = "Giá trị lớn nhất phải > 0";
      if (vMin && vMax && vMax <= vMin)
        errs.maxValue = "Giá trị lớn nhất phải lớn hơn giá trị nhỏ nhất";
    }
    
    setErrors(errs);
    
    if (Object.keys(errs).length === 0) {
      onSaveSetting({
        title,
        answer_type: answerType,
        min_char: minChar,
        max_char: maxChar,
        confirm_type: confirmType,
        min_value: minValue,
        max_value: maxValue,
      })
    }
  };
  
  return (
    <Box
      sx={{
        border: "1px solid #0088FF",
        borderRadius: 2,
        p: 2,
        mx: "auto",
        textAlign: "left"
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        label="Tựa đề *"
        size={"small"}
        placeholder="Nhập tiêu đề"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={!!errors.title}
        helperText={errors.title}
      />
      
      <Box sx={{mt: 3}}>
        <FormLabel sx={{fontWeight: "bold", color: "black",}}>
          Hình thức trả lời
        </FormLabel>
        <RadioGroup
          value={answerType}
          onChange={(e) => {
            setAnswerType(e.target.value);
            setErrors({});
          }}
          sx={{mt: 1}}
        >
          <Grid container rowSpacing={0}>
            <Grid size={6}>
              <FormControlLabel
                value="min"
                control={<Radio/>}
                label="Số ký tự tối thiểu"
              />
            </Grid>
            <Grid size={6}>
              <FormControlLabel
                value="max"
                control={<Radio/>}
                label="Số ký tự tối đa"
              />
            </Grid>
            <Grid size={6}>
              <FormControlLabel
                value="exact"
                control={<Radio/>}
                label="Chọn số ký tự"
              />
            </Grid>
            <Grid size={6}>
              <FormControlLabel
                value="confirm"
                control={<Radio/>}
                label="Xác nhận nội dung"
              />
            </Grid>
          </Grid>
        </RadioGroup>
      </Box>
      
      {/* Cài đặt ký tự */}
      {(answerType === "min" ||
        answerType === "max" ||
        answerType === "exact") && (
        <Grid container spacing={2} sx={{mt: 1}}>
          <Grid size={6}>
            <TextField
              fullWidth
              type="number"
              label="Nhập số ký tự tối thiểu"
              value={minChar}
              onChange={(e) => setMinChar(e.target.value)}
              disabled={answerType === "max"}
              error={!!errors.minChar}
              size="small"
              helperText={errors.minChar}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              fullWidth
              type="number"
              label="Nhập số ký tự tối đa"
              value={maxChar}
              size="small"
              onChange={(e) => setMaxChar(e.target.value)}
              disabled={answerType === "min"}
              error={!!errors.maxChar}
              helperText={errors.maxChar}
            />
          </Grid>
        </Grid>
      )}
      
      {/* Xác nhận nội dung */}
      {answerType === "confirm" && (
        <Box sx={{mt: 2}}>
          <Divider component={"p"} />
          <RadioGroup
            sx={{mt: 1}}
            row
            value={confirmType}
            onChange={(e) => setConfirmType(e.target.value)}
          >
            <Grid container rowSpacing={0}>
              <Grid size={6}>
                <FormControlLabel value="email" control={<Radio/>} label="Địa chỉ email"/>
              </Grid>
              <Grid size={6}>
                <FormControlLabel value="phone" control={<Radio/>} label="Số điện thoại"/>
              
              </Grid>
              <Grid size={6}>
                <FormControlLabel value="date" control={<Radio/>} label="Định dạng ngày"/>
              
              </Grid>
              <Grid size={6}>
                <FormControlLabel value="number" control={<Radio/>} label="Number (mặc định)"/>
              
              </Grid>
            </Grid>
          </RadioGroup>
          
          {confirmType === "number" && (
            <Grid container spacing={2} sx={{mt: 1}}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Giá trị nhỏ nhất"
                  size="small"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  error={!!errors.minValue}
                  helperText={errors.minValue}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Giá trị lớn nhất"
                  size="small"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  error={!!errors.maxValue}
                  helperText={errors.maxValue}
                />
              </Grid>
            </Grid>
          )}
        </Box>
      )}
      
      <Box sx={{mt: 3}}>
        <Button
          type="button"
          style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: 6,
            cursor: "pointer",
          }}
          onClick={handleSave}
        >
          Lưu
        </Button>
      </Box>
    </Box>
  );
};

export default FreeTextForm;
