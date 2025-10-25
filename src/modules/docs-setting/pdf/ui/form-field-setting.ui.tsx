import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import FreeTextForm from "./form/free-text.ui";
import DropdownForm from "./form/dropdown.ui";
import React from "react";
import {CustomerAttributeData, FormFieldSetting} from "../types/pdf-setting.type";
import {Box, Grid} from "@mui/material";
import {FIELD_OPTS, FIELD_VALUE_TYPE} from "@/modules/docs-setting/pdf/pdf.const";
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
  const ns = "modules.docs_setting.pdf.field_opts";
  
  const [field, setField] = React.useState<any>({...props.data});
  const optRef = React.useRef<{ save: () => any }>(null);
  
  const [opt, setOpt] = React.useState<string>(props.data?.setting?.type || FIELD_VALUE_TYPE.FREE_TEXT);
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
        label: t(`${ns}.base.dynamic_attr.label`, {attr: attribute.label}),
        value: attribute.value
      })
    });
    setFieldOpts(optInit);
  }, [attributes])
  
  React.useImperativeHandle(ref, () => ({
    save: () => {
      const data = optRef.current?.save();
      pdfLogger.log("📨 ChildForm forwarded save:", data, field);
      if (!data) return field;
      return data
    },
  }), [field]);
  
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
    
    // reset setting form for two specific type
    const oldSetting = [FIELD_VALUE_TYPE.FREE_TEXT, FIELD_VALUE_TYPE.DROPDOWN_SELECT].includes(newType) ? (field?.setting ?? {}) : {}
    
    let fieldUpdate: FormFieldSetting = {
      ...field,
      setting: {
        ...oldSetting,
        type: newType
      }
    };
    setField(fieldUpdate);
    onChange(fieldUpdate);
  };
  
  const fieldId = data.id;
  const styleBox = {
    borderRadius: '4px',
    border: `1px solid ${selectedField?.id === fieldId ? "#0088FF" : "#3C3C434A"}`,
    padding: '12px 8px'
  }
  return (
    <Box sx={[FIELD_VALUE_TYPE.FREE_TEXT, FIELD_VALUE_TYPE.DROPDOWN_SELECT].includes(opt) ? styleBox : {}}>
      <Grid container rowSpacing={2}>
        <Grid size={12}>
        <div className={"pdf_form-field-setting--item"}>
          <div className={"pdf_form-field-label"}>
            <p className={'pdf_text-pos'}>{t(`${ns}.text.position`, {position: data.position})}</p>
          </div>
          <FormControl sx={{width: '100%', textAlign: 'left'}} size="small">
            <InputLabel id={"pdf-select-field-" + fieldId}>{t(`${ns}.text.type_info`)}</InputLabel>
            <Select
              labelId={"pdf-select-field-" + fieldId}
              id={"pdf-field-setting" + fieldId}
              defaultValue={opt}
              value={opt}
              label={t(`${ns}.text.type_info`)}
              onChange={onFieldChange}
            >
              {fieldOpts.map((item: OptionData) => (
                <MenuItem key={item.value + fieldId} value={item.value}>{item.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        </Grid>
      
      {opt === FIELD_VALUE_TYPE.FREE_TEXT && (
        <Grid size={12}>
          <div className={"f-start"}>
            <FreeTextForm
              /*@ts-ignore*/
              ref={(r) => (optRef.current = r)}
              data={field} 
              onSaveSetting={(d) => handleSaveSetting(FIELD_VALUE_TYPE.FREE_TEXT, d)}
            />
          </div>
        </Grid>
      )}
      
      {opt === FIELD_VALUE_TYPE.DROPDOWN_SELECT && (
        <Grid size={12}>
          <div className={"f-start"}>
            <DropdownForm
              /*@ts-ignore*/
              ref={(r) => (optRef.current = r)}
              data={field} 
              onSaveSetting={(d) => handleSaveSetting(FIELD_VALUE_TYPE.DROPDOWN_SELECT, d)}
            />
          </div>
        </Grid>
      )}
      </Grid>
    </Box>
  );
});

export default FormFieldSettingUI;
