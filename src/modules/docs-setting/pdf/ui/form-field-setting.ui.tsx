import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import FreeTextForm from "./form/free-text.ui";
import DropdownForm from "./form/dropdown.ui";
import React from "react";
import {CustomerAttributeData, FormFieldSetting} from "../types/pdf-setting.type";
import {Box, Grid} from "@mui/material";
import {FIELD_OPTS} from "@/modules/docs-setting/pdf/pdf.const";
import { useTranslation } from 'react-i18next';
import {pdfLogger} from "@/modules/docs-setting/pdf/services/logger.service";


type IProps = {
  data: FormFieldSetting;
  selectedField: FormFieldSetting | null;
  attributes?: CustomerAttributeData[];
  onChange: (v: FormFieldSetting) => void;
}

type OptionData = {
  label: string;
  value: string;
}

const FormFieldSettingUI = React.forwardRef((props: IProps, ref) => {
  const {data, onChange, attributes, selectedField} = props;
  const { t } = useTranslation();
  
  const [field, setField] = React.useState<any>({...props.data});
  const optRef = React.useRef<{ save: () => any }>(null);
  
  const [opt, setOpt] = React.useState<string>(props.data?.setting?.type || 'free_text');
  const [fieldOpts, setFieldOpts] = React.useState<OptionData[]>([]);
  
  React.useEffect(() => {
    let optInit: any[] = FIELD_OPTS.map((opt) => {
      return {
        ...opt,
        label: t(opt.label),
        description: t(opt.description)
      }
    })
    
    attributes?.forEach((attribute) => {
      optInit.push({
        label: t('modules.docs_setting.pdf.field_opts.base.dynamic_attr.label', {attr: attribute.label}),
        value: attribute.value
      })
    });
    setFieldOpts(optInit);
  }, [attributes])
  
  React.useImperativeHandle(ref, () => ({
    save: () => {
      const data = optRef.current?.save();
      pdfLogger.log("📨 ChildForm forwarded save:", data);
      return data
    },
  }));
  
  const handleSaveSetting = (type: string, settingData: any) => {
    const newField: FormFieldSetting = {
      ...field,
      setting: {
        type,
        ...settingData
      }
    };
    setField(newField);
    onChange(newField);
  }

  const onFieldChange = (event: SelectChangeEvent) => {
    const newType = event.target.value;
    setOpt(newType);
    let fieldUpdate: FormFieldSetting = {
      ...field,
      setting: {
        ...(field?.setting ?? {}),
        type: newType
      }
    };
    onChange(fieldUpdate);
  };
  
  const fieldId = data.id;
  const styleBox = {
    borderRadius: '4px',
    border: `1px solid ${selectedField?.id === fieldId ? "#0088FF" : "#3C3C434A"}`,
    padding: '12px 8px'
  }
  return (
    <Box sx={['free_text', 'dropdown_select'].includes(opt) ? styleBox : {}}>
      <Grid container rowSpacing={2}>
        <Grid size={12}>
        <div className={"pdf_form-field-setting--item"}>
          <div className={"pdf_form-field-label"}>
            <p className={'pdf_text-pos'}>Vị trí {data.position}</p>
          </div>
          <FormControl sx={{width: '100%', textAlign: 'left'}} size="small">
            <InputLabel id={"pdf-select-field-" + fieldId}>Loại thông tin*</InputLabel>
            <Select
              labelId={"pdf-select-field-" + fieldId}
              id={"pdf-field-setting" + fieldId}
              defaultValue={opt}
              value={opt}
              label="Loại thông tin*"
              onChange={onFieldChange}
            >
              <MenuItem key={'free_text_' + fieldId} value={'free_text'}>
                <em>Free text</em>
              </MenuItem>
              {fieldOpts.map((item: OptionData) => (
                <MenuItem key={item.value + fieldId} value={item.value}>{item.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        </Grid>
      
      {opt === 'free_text' && (
        <Grid size={12}>
          <div className={"f-start"}>
            <FreeTextForm
              /*@ts-ignore*/
              ref={(r) => (optRef.current = r)}
              data={field} 
              onSaveSetting={(d) => handleSaveSetting('free_text', d)}
            />
          </div>
        </Grid>
      )}
      
      {opt === 'dropdown_select' && (
        <Grid size={12}>
          <div className={"f-start"}>
            <DropdownForm
              /*@ts-ignore*/
              ref={(r) => (optRef.current = r)}
              data={field} 
              onSaveSetting={(d) => handleSaveSetting('dropdown_select', d)}
            />
          </div>
        </Grid>
      )}
      </Grid>
    </Box>
  );
});

export default FormFieldSettingUI;
