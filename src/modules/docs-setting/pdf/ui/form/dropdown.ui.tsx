import React, {useEffect, useState} from "react";
import {Box, Button, IconButton, TextField, Typography} from "@mui/material";
import {AddCircleOutlineOutlined, RemoveCircleOutlineOutlined} from "@mui/icons-material";

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

const DropdownForm: React.FC<DropdownFormProps> = ({data, onSaveSetting}) => {
  //@ts-ignore
  const [form, setForm] = useState<FormState>(() => normalizeDataToForm(data?.setting || null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Đồng bộ dữ liệu khi data thay đổi
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
    
    if (!f.title.trim()) errs.title = "Vui lòng nhập tiêu đề";
    else if (f.title.length > 400) errs.title = "Tựa đề không được vượt quá 400 ký tự";
    
    f.options.forEach((opt, idx) => {
      if (!opt.trim()) errs[`option_${idx}`] = "Vui lòng nhập đáp án";
      else if (opt.length > 255)
        errs[`option_${idx}`] = "Đáp án không được vượt quá 255 ký tự";
    });
    
    if (f.options.length < 2)
      errs["options"] = "Phải có ít nhất 2 đáp án";
    
    return errs;
  };
  
  const handleSave = () => {
    const errs = validate(form);
    setErrors(errs);
    
    if (Object.keys(errs).length === 0) {
      onSaveSetting({
        title: form.title,
        options: form.options,
      });
    }
  };
  
  return (
    <Box
      sx={{
        border: "1px solid #0088FF",
        borderRadius: 2,
        p: 2,
        mx: "auto",
        textAlign: "left",
        width: "100%",
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        label="Tựa đề *"
        size="small"
        placeholder="Nhập tiêu đề"
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
            Tùy chỉnh số lượng giá trị
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
              placeholder="Điền giá trị"
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              error={!!errors[`option_${idx}`]}
              helperText={errors[`option_${idx}`]}
            />
          </Box>
        ))}
      
      
      </Box>
      
      <Box sx={{mt: 3}}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Lưu
        </Button>
      </Box>
    </Box>
  );
};

export default DropdownForm;
