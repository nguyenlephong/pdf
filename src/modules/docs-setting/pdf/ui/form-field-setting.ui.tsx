import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, {SelectChangeEvent} from '@mui/material/Select';

type IProps = {
  data: any;
  pos: number;
  value: any;
  onChange: (v: string) => void;
}
const FormFieldSetting = (props: IProps) => {
  const {data, onChange} = props;
  const onFieldChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };
  
  
  const fieldId = data.id
  return (
    <div className={"pdf_form-field-setting--item"}>
      <div className={"pdf_form-field-label"}>
        <p>Vị trí {props.pos}</p>
      </div>
      <FormControl sx={{m: 1, width: '100%', textAlign: 'left'}} size="small">
        <InputLabel id={"pdf-select-field-" + fieldId}>Loại thông tin*</InputLabel>
        <Select
          labelId={"pdf-select-field-" + fieldId}
          id={"pdf-field-setting" + fieldId}
          value={props.value}
          label="Loại thông tin*"
          onChange={onFieldChange}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {[
            {
              label: 'Hệ thống - Ngày tháng năm thời điểm ký',
              value: 'date_time'
            },
            {
              label: 'Dữ liệu nền - Mã khách hàng',
              value: 'customer_code'
            },
            {
              label: 'Dữ liệu nền - Tên khách hàng',
              value: 'customer_name'
            },
            {
              label: 'Free text',
              value: 'free_text'
            }
          ].map((item) => (
            <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
          
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default FormFieldSetting;
