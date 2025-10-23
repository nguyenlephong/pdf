import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';
import FreeTextForm from "./form/free-text.ui";
import DropdownForm from "./form/dropdown.ui";
import React from "react";
import {Col, Row} from "antd";
import {FormFieldSetting} from "../types/pdf-setting.type";

type IProps = {
  data: any;
  pos: number;
  value: any;
  onChange: (v: FormFieldSetting) => void;
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
    "label": 'Dữ liệu nền - Thuộc tính - "Tên thuộc tính"',
    "value": "base_attribute",
    "description": ""
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

const FormFieldSettingUI = (props: IProps) => {
  const {data, onChange} = props;
  
  const [field, setField] = React.useState<any>({...props.data});
  
  const [opt, setOpt] = React.useState<string>(props.data?.setting?.type || 'free_text');
  
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
console.log(`👨‍🎓 PhongNguyen 🎯 form-field-setting.ui.tsx 👉 FormFieldSettingUI 📝:`, field, opt)
  return (
    <Row gutter={[12, 12]}>
      <Col xs={24}>
        <div className={"pdf_form-field-setting--item"}>
          <div className={"pdf_form-field-label"}>
            <p>Vị trí {data.position}</p>
          </div>
          <FormControl sx={{m: 1, width: '100%', textAlign: 'left'}} size="small">
            <InputLabel id={"pdf-select-field-" + fieldId}>Loại thông tin*</InputLabel>
            <Select
              labelId={"pdf-select-field-" + fieldId}
              id={"pdf-field-setting" + fieldId}
              defaultValue={opt}
              value={opt}
              label="Loại thông tin*"
              onChange={onFieldChange}
            >
              <MenuItem value={'free_text'}>
                <em>Free text</em>
              </MenuItem>
              {FIELD_OPTS.map((item) => (
                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </Col>
      
      {opt === 'free_text' && (
        <Col xs={24}>
          <div className={"f-start"}>
            <FreeTextForm 
              data={field} 
              onSaveSetting={(d) => handleSaveSetting('free_text', d)}
            />
          </div>
        </Col>
      )}
      
      {opt === 'dropdown_select' && (
        <Col xs={24}>
          <div className={"f-start"}>
            <DropdownForm 
              data={field} 
              onSaveSetting={(d) => handleSaveSetting('dropdown_select', d)}
            />
          </div>
        </Col>
      )}
    </Row>
  
  );
};

export default FormFieldSettingUI;
