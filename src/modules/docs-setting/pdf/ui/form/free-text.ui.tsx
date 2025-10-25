import React, {useEffect, useState} from "react";
import {Box, Divider, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField,} from "@mui/material";
import {useTranslation} from "react-i18next";
import NumericInput from "@/modules/docs-setting/pdf/ui/form/number-input.ui";
import {FIELD_VALUE_TYPE} from "@/modules/docs-setting/pdf/pdf.const";
import {FormFieldSetting} from "@/modules/docs-setting/pdf/types/pdf-setting.type";

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
  data?: Partial<FormFieldSetting> | null;
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

const FreeTextForm: React.FC<ItemConfProps> = React.forwardRef(({ data, onSaveSetting }, ref) => {
  const {t} = useTranslation();
  const ns = "modules.docs_setting.pdf.free_text_form";
  
  // @ts-ignore
  const [form, setForm] = useState<FormState>(() => normalizeDataToForm(data?.setting || null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    //@ts-ignore
    const next = normalizeDataToForm(data?.setting);
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
  
  const updateForm = (patch: Partial<FormState>) => {
    setForm((prev) => ({...prev, ...patch}));
  };
  
  const clearFieldError = (name: keyof FormState) => {
    setErrors((prev) => {
      if (!(name in prev)) return prev;
      const { [name]: _ignored, ...rest } = prev;
      return rest;
    });
  };
  
  const handleInputChange = (name: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    updateForm({[name]: e.target.value} as Partial<FormState>);
    clearFieldError(name);
  };
  
  const handleNumberInputChange = (name: keyof FormState) => (n: number) => {
    updateForm({[name]: n} as Partial<FormState>);
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
  
  const checkPositive = (val: string | number): boolean => {
    const num = Number(val);
    
    // Must be a finite integer within JS safe range and > 0
    return (
      Number.isFinite(num) &&
      Number.isInteger(num) &&
      num > 0 &&
      num <= Number.MAX_SAFE_INTEGER
    );
  };
  
  const validate = (f: FormState) => {
    const errs: Record<string, string> = {};
    
    if (!f?.title?.trim()) errs.title = t(`${ns}.errors.title_required`);
    else if (f.title.length > 400) errs.title = t(`${ns}.errors.title_too_long`, {max: 400});
    
    if (f?.answerType === "min") {
      if (!checkPositive(f.minChar)) errs.minChar = t(`${ns}.errors.min_char_required`);
      if (Number(f.minChar) >= Number.MAX_SAFE_INTEGER)
        errs.minChar = t(`${ns}.errors.char_invalid`);
    }
    
    if (f?.answerType === "max") {
      if (!checkPositive(f.maxChar)) errs.maxChar = t(`${ns}.errors.max_char_required`);
      if (Number(f.maxChar) >= Number.MAX_SAFE_INTEGER)
        errs.maxChar = t(`${ns}.errors.char_invalid`);
    }
    
    if (f?.answerType === "exact") {
      const numMin = parseInt(f.minChar, 10);
      const numMax = parseInt(f.maxChar, 10);
      
      if (!checkPositive(f.minChar)) errs.minChar = t(`${ns}.errors.min_char_required`);
      if (!checkPositive(f.maxChar)) errs.maxChar = t(`${ns}.errors.max_char_required`);
      if (checkPositive(f.minChar) && checkPositive(f.maxChar) && numMax <= numMin)
        errs.maxChar = t(`${ns}.errors.max_char_less_than_min`);
      
      if (Number(f.minChar) >= Number.MAX_SAFE_INTEGER)
        errs.minChar = t(`${ns}.errors.char_invalid`);
      if (Number(f.maxChar) >= Number.MAX_SAFE_INTEGER)
        errs.maxChar = t(`${ns}.errors.char_invalid`);
    }
    
    if (f.answerType === "confirm" && f.confirmType === "number") {
      const vMin = parseInt(f.minValue, 10);
      const vMax = parseInt(f.maxValue, 10);
      if (f.minValue && !checkPositive(f.minValue))
        errs.minValue = t(`${ns}.errors.min_value_positive`);
      if (f.maxValue && !checkPositive(f.maxValue))
        errs.maxValue = t(`${ns}.errors.max_value_positive`);
      if (vMin && vMax && vMax <= vMin)
        errs.maxValue = t(`${ns}.errors.max_value_greater_than_min`);
      if (Number(f.minValue) >= Number.MAX_SAFE_INTEGER)
        errs.minValue = t(`${ns}.errors.min_value_too_large`);
      if (Number(f.maxValue) >= Number.MAX_SAFE_INTEGER)
        errs.maxValue = t(`${ns}.errors.max_value_too_large`);
    }
    
    return errs;
  };
  
  const handleSave = (dataForm: FormState) => {
    const errs = validate(dataForm);
    setErrors(errs);
    
    if (Object.keys(errs).length === 0) {
      const dataSaving = {
        title: form.title,
        answer_type: form.answerType,
        min_char: form.minChar,
        max_char: form.maxChar,
        confirm_type: form.confirmType,
        min_value: form.minValue,
        max_value: form.maxValue,
      };
      onSaveSetting(dataSaving);
      return {
        ...data,
        setting: {
          ...dataSaving,
          type: FIELD_VALUE_TYPE.FREE_TEXT
        }
      };
    }
    
    return -1;
  };
  
  React.useImperativeHandle(ref, () => ({
    save: () => handleSave(form),
  }));
  
  const { title, answerType, minChar, maxChar, confirmType, minValue, maxValue } = form;
  
  return (
    <Box sx={{textAlign: "left", width: "100%"}}>
      <TextField
        fullWidth
        variant="outlined"
        label={t(`${ns}.fields.title_label`)}
        size="small"
        placeholder={t(`${ns}.fields.title_placeholder`)}
        value={title}
        onChange={handleInputChange("title")}
        error={!!errors.title}
        helperText={errors.title}
      />
      
      <Box sx={{ mt: 3 }}>
        <FormLabel sx={{ fontWeight: "bold", color: "black" }}>
          {t(`${ns}.fields.answer_type_label`)}
        </FormLabel>
        <RadioGroup value={answerType} onChange={handleAnswerTypeChange} sx={{mt: 1}}>
          <Grid container rowSpacing={0}>
            <Grid size={6}>
              <FormControlLabel value="min" control={<Radio/>} label={t(`${ns}.options.min`)}/>
            </Grid>
            <Grid size={6}>
              <FormControlLabel value="max" control={<Radio/>} label={t(`${ns}.options.max`)}/>
            </Grid>
            <Grid size={6}>
              <FormControlLabel value="exact" control={<Radio/>} label={t(`${ns}.options.exact`)}/>
            </Grid>
            <Grid size={6}>
              <FormControlLabel
                value="confirm"
                control={<Radio/>}
                label={t(`${ns}.options.confirm`)}
              />
            </Grid>
          </Grid>
        </RadioGroup>
      </Box>
      
      {(answerType === "min" || answerType === "max" || answerType === "exact") && (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={6}>
            <NumericInput
              fullWidth
              type="number"
              label={t(`${ns}.fields.min_char_label`)}
              value={minChar}
              onChange={handleNumberInputChange("minChar")}
              disabled={answerType === "max"}
              error={!!errors.minChar}
              size="small"
              helperText={errors.minChar}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid size={6}>
            <NumericInput
              fullWidth
              type="number"
              label={t(`${ns}.fields.max_char_label`)}
              value={maxChar}
              size="small"
              onChange={handleNumberInputChange("maxChar")}
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
          <RadioGroup sx={{mt: 1}} row value={confirmType} onChange={handleConfirmTypeChange}>
            <Grid container rowSpacing={0}>
              <Grid size={6}>
                <FormControlLabel
                  value="email"
                  control={<Radio/>}
                  label={t(`${ns}.fields.confirm_type_email`)}
                />
              </Grid>
              <Grid size={6}>
                <FormControlLabel
                  value="phone"
                  control={<Radio/>}
                  label={t(`${ns}.fields.confirm_type_phone`)}
                />
              </Grid>
              <Grid size={6}>
                <FormControlLabel
                  value="date"
                  control={<Radio/>}
                  label={t(`${ns}.fields.confirm_type_date`)}
                />
              </Grid>
              <Grid size={6}>
                <FormControlLabel
                  value="number"
                  control={<Radio/>}
                  label={t(`${ns}.fields.confirm_type_number`)}
                />
              </Grid>
            </Grid>
          </RadioGroup>
          
          {confirmType === "number" && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={6}>
                <NumericInput
                  fullWidth
                  type="number"
                  label={t(`${ns}.fields.min_value_label`)}
                  size="small"
                  value={minValue}
                  onChange={handleNumberInputChange("minValue")}
                  error={!!errors.minValue}
                  helperText={errors.minValue}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid size={6}>
                <NumericInput
                  fullWidth
                  type="number"
                  label={t(`${ns}.fields.max_value_label`)}
                  size="small"
                  value={maxValue}
                  onChange={handleNumberInputChange("maxValue")}
                  error={!!errors.maxValue}
                  helperText={errors.maxValue}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
          )}
        </Box>
      )}
    </Box>
  );
});

export default FreeTextForm;