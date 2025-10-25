import React, {useEffect, useState} from "react";
import {Box, IconButton, TextField, Typography} from "@mui/material";
import {AddCircleOutlineOutlined, RemoveCircleOutlineOutlined} from "@mui/icons-material";
import {useTranslation} from "react-i18next";

type SavePayload = {
  title: string;
  options: string[];
};

type DropdownFormProps = {
  data?: Partial<SavePayload> | null;
  onSaveSetting: (data: SavePayload) => void;
};

type FormState = {
  title: string;
  options: string[];
};

function padZero(num: number) {
  return num < 10 ? `0${num}` : String(num);
}

const normalizeDataToForm = (data?: Partial<SavePayload> | null): FormState => ({
  title: data?.title ?? "",
  options: Array.isArray(data?.options) && data!.options.length > 0
    ? data!.options
    : ["", ""],
});

const DropdownForm: React.FC<DropdownFormProps> = React.forwardRef(({data, onSaveSetting}, ref) => {
  const {t} = useTranslation();
  // @ts-ignore
  const [form, setForm] = useState<FormState>(() => normalizeDataToForm(data?.setting || null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    //@ts-ignore
    const next = normalizeDataToForm(data?.setting || null);
    setForm((prev) => {
      if (
        prev.title === next.title &&
        JSON.stringify(prev.options) === JSON.stringify(next.options)
      ) {
        return prev;
      }
      return next;
    });
  }, [data]);
  
  const updateForm = (patch: Partial<FormState>) => {
    setForm((prev) => ({...prev, ...patch}));
  };
  
  const clearFieldError = (name: string) => {
    setErrors((prev) => {
      if (!(name in prev)) return prev;
      const {[name]: _ignored, ...rest} = prev;
      return rest;
    });
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateForm({title: e.target.value});
    clearFieldError("title");
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    updateForm({options: newOptions});
    clearFieldError(`option_${index}`);
  };
  
  const handleAddOption = () => {
    updateForm({options: [...form.options, ""]});
  };
  
  const handleRemoveOption = () => {
    if (form.options.length > 2) {
      updateForm({options: form.options.slice(0, -1)});
    }
  };
  
  const validate = (f: FormState) => {
    const errs: Record<string, string> = {};
    
    if (!f?.title?.trim())
      errs.title = t("modules.docs_setting.pdf.dropdown_form.errors.title_required");
    else if (f.title?.length > 400)
      errs.title = t("modules.docs_setting.pdf.dropdown_form.errors.title_too_long", {max: 400});
    
    f.options.forEach((opt, idx) => {
      if (!opt?.trim())
        errs[`option_${idx}`] = t("modules.docs_setting.pdf.dropdown_form.errors.option_required", {index: idx + 1});
      else if (opt.length > 255)
        errs[`option_${idx}`] = t("modules.docs_setting.pdf.dropdown_form.errors.option_too_long", {
          index: idx + 1,
          max: 255
        });
    });
    
    if (f.options.length < 2)
      errs["options"] = t("modules.docs_setting.pdf.dropdown_form.errors.options_minimum", {
        min: 2,
        count: f.options.length,
      });
    
    return errs;
  };
  
  const handleSave = (formData: FormState) => {
    const errs = validate(formData);
    setErrors(errs);
    
    if (Object.keys(errs).length === 0) {
      const dataSaving = {
        title: formData.title,
        options: formData.options,
      };
      onSaveSetting(dataSaving);
      return dataSaving;
    }
    
    return -1;
  };
  
  React.useImperativeHandle(ref, () => ({
    save: () => handleSave(form),
  }));
  
  return (
    <Box sx={{textAlign: "left", width: "100%"}}>
      <TextField
        fullWidth
        variant="outlined"
        label={t("modules.docs_setting.pdf.dropdown_form.title_label")}
        size="small"
        placeholder={t("modules.docs_setting.pdf.dropdown_form.title_placeholder")}
        value={form.title}
        onChange={handleTitleChange}
        error={!!errors.title}
        helperText={errors.title}
      />
      
      <Box sx={{mt: 3}}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: 2,
            mb: 1,
          }}
        >
          <Typography fontWeight="bold">
            {t("modules.docs_setting.pdf.dropdown_form.option_count_title")}
          </Typography>
          
          <Box sx={{display: "flex", justifyContent: "flex-start", gap: 1, mt: 1}}>
            
            <IconButton
              color="error"
              onClick={handleRemoveOption}
              disabled={form.options.length <= 2}
            >
              <RemoveCircleOutlineOutlined/>
            </IconButton>
            
            <Typography fontWeight="bold" className={"f-center"}>
              {padZero(form.options.length)}
            </Typography>
            
            <IconButton color="primary" onClick={handleAddOption}>
              <AddCircleOutlineOutlined/>
            </IconButton>
          </Box>
        </Box>
        
        {form.options.map((opt, idx) => (
          <Box key={idx} sx={{display: "flex", alignItems: "center", mb: 1}}>
            <TextField
              fullWidth
              size="small"
              placeholder={t("modules.docs_setting.pdf.dropdown_form.option_placeholder")}
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              error={!!errors[`option_${idx}`]}
              helperText={errors[`option_${idx}`]}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
});

export default DropdownForm;
