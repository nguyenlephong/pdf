import React, { useEffect, useState } from "react";
import {
  Box,
  Divider,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Button,
} from "@mui/material";

type AnswerType = "min" | "max" | "exact" | "confirm";
type ConfirmType = "email" | "phone" | "date" | "number";

type SavePayload = {
  title: string;
  answer_type: AnswerType;
  min_char: string;
  max_char: string;
  confirm_type: ConfirmType;
  min_value: string;
  max_value: string;
};

type ItemConfProps = {
  onSaveSetting: (data: SavePayload) => void;
  data?: Partial<SavePayload> | null;
};

type FormState = {
  title: string;
  answerType: AnswerType;
  minChar: string;
  maxChar: string;
  confirmType: ConfirmType;
  minValue: string;
  maxValue: string;
};

const normalizeDataToForm = (data?: Partial<SavePayload> | null): FormState => ({
  title: data?.title ?? "",
  answerType: (data?.answer_type as AnswerType) ?? "min",
  minChar: data?.min_char?.toString?.() ?? "",
  maxChar: data?.max_char?.toString?.() ?? "",
  confirmType: (data?.confirm_type as ConfirmType) ?? "number",
  minValue: data?.min_value?.toString?.() ?? "",
  maxValue: data?.max_value?.toString?.() ?? "",
});

const FreeTextForm: React.FC<ItemConfProps> = ({ data, onSaveSetting }) => {
  // @ts-ignore
  const [form, setForm] = useState<FormState>(() => normalizeDataToForm(data?.setting || null));
  // Error state theo field
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Đồng bộ khi props.data thay đổi (chỉ set khi thực sự khác để tránh re-render thừa)
  useEffect(() => {
    
    const next = normalizeDataToForm(data?.setting);
    console.log(`👨‍🎓 PhongNguyen 🎯 free-text.ui.tsx 👉 next 📝:`, next, data)
    setForm((prev) => {
      const same =
        prev.title === next.title &&
        prev.answerType === next.answerType &&
        prev.minChar === next.minChar &&
        prev.maxChar === next.maxChar &&
        prev.confirmType === next.confirmType &&
        prev.minValue === next.minValue &&
        prev.maxValue === next.maxValue;
      return same ? prev : next;
    });
  }, [data]);
  
  // Helpers
  const updateForm = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };
  
  const clearFieldError = (name: keyof FormState) => {
    setErrors((prev) => {
      if (!(name in prev)) return prev;
      const { [name]: _ignored, ...rest } = prev;
      return rest;
    });
  };
  
  const handleInputChange =
    (name: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      updateForm({ [name]: e.target.value } as Partial<FormState>);
      clearFieldError(name);
    };
  
  const handleAnswerTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateForm({ answerType: e.target.value as AnswerType });
    setErrors({});
  };
  
  const handleConfirmTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateForm({ confirmType: e.target.value as ConfirmType });
    // Xoá lỗi min/max value khi đổi confirm type
    setErrors((prev) => {
      const { minValue, maxValue, ...rest } = prev;
      return rest;
    });
  };
  
  const checkPositive = (val: string) => /^\d+$/.test(val) && Number(val) > 0;
  
  const validate = (f: FormState) => {
    const errs: Record<string, string> = {};
    
    // validate title
    if (!f.title.trim()) errs.title = "Vui lòng nhập tiêu đề";
    else if (f.title.length > 400) errs.title = "Tựa đề không được vượt quá 400 ký tự";
    
    // validate theo answerType
    if (f.answerType === "min") {
      if (!checkPositive(f.minChar)) errs.minChar = "Vui lòng nhập số ký tự tối thiểu";
    }
    
    if (f.answerType === "max") {
      if (!checkPositive(f.maxChar)) errs.maxChar = "Vui lòng nhập số ký tự tối đa";
    }
    
    if (f.answerType === "exact") {
      const numMin = parseInt(f.minChar, 10);
      const numMax = parseInt(f.maxChar, 10);
      
      if (!checkPositive(f.minChar)) errs.minChar = "Vui lòng nhập số ký tự tối thiểu";
      if (!checkPositive(f.maxChar)) errs.maxChar = "Vui lòng nhập số ký tự tối đa";
      if (checkPositive(f.minChar) && checkPositive(f.maxChar) && numMax <= numMin) {
        errs.maxChar = "Ký tự tối đa phải lớn hơn ký tự tối thiểu";
      }
    }
    
    if (f.answerType === "confirm" && f.confirmType === "number") {
      const vMin = parseInt(f.minValue, 10);
      const vMax = parseInt(f.maxValue, 10);
      if (f.minValue && !checkPositive(f.minValue)) errs.minValue = "Giá trị nhỏ nhất phải > 0";
      if (f.maxValue && !checkPositive(f.maxValue)) errs.maxValue = "Giá trị lớn nhất phải > 0";
      if (vMin && vMax && vMax <= vMin) {
        errs.maxValue = "Giá trị lớn nhất phải lớn hơn giá trị nhỏ nhất";
      }
    }
    
    return errs;
  };
  
  const handleSave = () => {
    const errs = validate(form);
    setErrors(errs);
    
    if (Object.keys(errs).length === 0) {
      onSaveSetting({
        title: form.title,
        answer_type: form.answerType,
        min_char: form.minChar,
        max_char: form.maxChar,
        confirm_type: form.confirmType,
        min_value: form.minValue,
        max_value: form.maxValue,
      });
    }
  };
  
  const { title, answerType, minChar, maxChar, confirmType, minValue, maxValue } = form;
  console.log(`👨‍🎓 PhongNguyen 🎯 free-text.ui.tsx 👉 FreeTextForm 📝form :`, form)
  return (
    <Box
      sx={{
        border: "1px solid #0088FF",
        borderRadius: 2,
        p: 2,
        mx: "auto",
        textAlign: "left",
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        label="Tựa đề *"
        size="small"
        placeholder="Nhập tiêu đề"
        value={title}
        onChange={handleInputChange("title")}
        error={!!errors.title}
        helperText={errors.title}
      />
      
      <Box sx={{ mt: 3 }}>
        <FormLabel sx={{ fontWeight: "bold", color: "black" }}>
          Hình thức trả lời
        </FormLabel>
        <RadioGroup
          value={answerType}
          onChange={handleAnswerTypeChange}
          sx={{ mt: 1 }}
        >
          <Grid container rowSpacing={0}>
            <Grid size={6}>
              <FormControlLabel value="min" control={<Radio />} label="Số ký tự tối thiểu" />
            </Grid>
            <Grid size={6}>
              <FormControlLabel value="max" control={<Radio />} label="Số ký tự tối đa" />
            </Grid>
            <Grid size={6}>
              <FormControlLabel value="exact" control={<Radio />} label="Chọn số ký tự" />
            </Grid>
            <Grid size={6}>
              <FormControlLabel value="confirm" control={<Radio />} label="Xác nhận nội dung" />
            </Grid>
          </Grid>
        </RadioGroup>
      </Box>
      
      {(answerType === "min" || answerType === "max" || answerType === "exact") && (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={6}>
            <TextField
              fullWidth
              type="number"
              label="Nhập số ký tự tối thiểu"
              value={minChar}
              onChange={handleInputChange("minChar")}
              disabled={answerType === "max"}
              error={!!errors.minChar}
              size="small"
              helperText={errors.minChar}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              fullWidth
              type="number"
              label="Nhập số ký tự tối đa"
              value={maxChar}
              size="small"
              onChange={handleInputChange("maxChar")}
              disabled={answerType === "min"}
              error={!!errors.maxChar}
              helperText={errors.maxChar}
              inputProps={{ min: 1 }}
            />
          </Grid>
        </Grid>
      )}
      
      {answerType === "confirm" && (
        <Box sx={{ mt: 2 }}>
          <Divider component="p" />
          <RadioGroup
            sx={{ mt: 1 }}
            row
            value={confirmType}
            onChange={handleConfirmTypeChange}
          >
            <Grid container rowSpacing={0}>
              <Grid size={6}>
                <FormControlLabel value="email" control={<Radio />} label="Địa chỉ email" />
              </Grid>
              <Grid size={6}>
                <FormControlLabel value="phone" control={<Radio />} label="Số điện thoại" />
              </Grid>
              <Grid size={6}>
                <FormControlLabel value="date" control={<Radio />} label="Định dạng ngày" />
              </Grid>
              <Grid size={6}>
                <FormControlLabel value="number" control={<Radio />} label="Number (mặc định)" />
              </Grid>
            </Grid>
          </RadioGroup>
          
          {confirmType === "number" && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Giá trị nhỏ nhất"
                  size="small"
                  value={minValue}
                  onChange={handleInputChange("minValue")}
                  error={!!errors.minValue}
                  helperText={errors.minValue}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Giá trị lớn nhất"
                  size="small"
                  value={maxValue}
                  onChange={handleInputChange("maxValue")}
                  error={!!errors.maxValue}
                  helperText={errors.maxValue}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
          )}
        </Box>
      )}
      
      <Box sx={{ mt: 3 }}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Lưu
        </Button>
      </Box>
    </Box>
  );
};

export default FreeTextForm;