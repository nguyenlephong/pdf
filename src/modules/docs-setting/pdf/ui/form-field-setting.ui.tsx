import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import FreeTextForm from "./form/free-text.ui";
import DropdownForm from "./form/dropdown.ui";
import React from "react";
import {CustomerAttributeData, FormFieldSetting} from "../types/pdf-setting.type";
import {Box, Grid} from "@mui/material";

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
const FIELD_OPTS = [
  {
    "label": "Hệ thống - Ngày tháng năm ký",
    "value": "system_sign_date",
    "description": "App tự động lấy ngày ký hiện tại khi thực hiện ký thông tin, không cho phép chỉnh sửa."
  },
  {
    "label": "Hệ thống - Số CCCD khi xác thực",
    "value": "system_cccd_number",
    "description": "App tự động lấy số CCCD từ chứng thư số của người xác thực, không cho phép chỉnh sửa."
  },
  {
    "label": "Hệ thống - Tên trên CCCD khi xác thực",
    "value": "system_cccd_name",
    "description": "App tự động lấy tên trên chứng thư số CCCD của người xác thực, không cho phép chỉnh sửa."
  },
  {
    "label": "Hệ thống - Địa chỉ trên CCCD khi xác thực",
    "value": "system_cccd_address",
    "description": "App tự động lấy địa chỉ trên chứng thư số CCCD của người xác thực, không cho phép chỉnh sửa."
  },
  {
    "label": "Dữ liệu nền - Mã khách hàng",
    "value": "base_customer_code",
    "description": "App tự động lấy mã khách hàng (brand) hiển thị trên tài liệu, không cho phép chỉnh sửa."
  },
  {
    "label": "Dữ liệu nền - Tên khách hàng",
    "value": "base_customer_name",
    "description": "App tự động lấy tên khách hàng (brand) hiển thị trên tài liệu, không cho phép chỉnh sửa."
  },
  {
    "label": "Dữ liệu nền - Địa chỉ",
    "value": "base_customer_address",
    "description": "App tự động lấy thông tin địa chỉ khách hàng (brand) hiển thị trên tài liệu, không cho phép chỉnh sửa."
  },
  {
    "label": "Chọn giá trị",
    "value": "dropdown_select",
    "description": ""
  }
];

const FormFieldSettingUI = React.forwardRef((props: IProps, ref) => {
  const {data, onChange, attributes, selectedField} = props;
  
  const [field, setField] = React.useState<any>({...props.data});
  const optRef = React.useRef<{ save: () => any }>(null);
  
  const [opt, setOpt] = React.useState<string>(props.data?.setting?.type || 'free_text');
  const [fieldOpts, setFieldOpts] = React.useState<OptionData[]>([]);
  
  React.useEffect(() => {
    let optInit: any[] = FIELD_OPTS.map((opt) => (opt))
    attributes?.forEach((attribute) => {
      optInit.push({
        label: "Dữ liệu nền - Thuộc tính - " + attribute.label,
        value: attribute.value
      })
    });
    setFieldOpts(optInit);
  }, [attributes])
  
  React.useImperativeHandle(ref, () => ({
    save: () => {
      const data = optRef.current?.save();
      console.log("📨 ChildForm forwarded save:", data);
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
