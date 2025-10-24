import {createBrowserRouter,} from "react-router";
import RootLayout from "./root";
import AppPoc from "../modules/docs-setting/poc/App";
import PDFSetting from "../modules/docs-setting/pdf/pdf.ui";
import NotFound from "./not-found";
import {PDFSettingData} from "../modules/docs-setting/pdf/types/pdf-setting.type";

const settingDataExample: PDFSettingData = {
  "name": "HDPDFEmpty.docx.pdf",
  "form_fields": [
    {
      "id": "field_1761109832026",
      "meta": {
        "label": "a_alias",
        "name": "a_alias",
        "required": false,
        "placeholder": "",
        "ts": -1,
        "type": "text"
      },
      "box": {
        "x": 122.81640625,
        "y": 302.796875,
        "width": 363,
        "height": 31
      },
      "font_size": 12,
      "color": "#000000",
      "page_number": 1,
      "position": 1,
      "setting": {
        "type": "free_text",
        "title": "Bên A",
        "answer_type": "min",
        "min_char": "123",
        "max_char": "",
        "confirm_type": "number",
        "min_value": "",
        "max_value": ""
      }
    },
    {
      "id": "field_1761212780324",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 122.28125,
        "y": 365.46875,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761212780324
      },
      "position": 2,
      "page_number": 1,
      "setting": {
        "type": "free_text",
        "title": "Chuc Vu",
        "answer_type": "min",
        "min_char": "21",
        "max_char": "",
        "confirm_type": "number",
        "min_value": "",
        "max_value": ""
      }
    },
    {
      "id": "field_1761212783716",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 123.72656875000001,
        "y": 427.29300624999996,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761212783716
      },
      "position": 3,
      "page_number": 1,
      "setting": {
        "type": "free_text",
        "title": "phone_number",
        "answer_type": "exact",
        "min_char": "9",
        "max_char": "13",
        "confirm_type": "number",
        "min_value": "",
        "max_value": ""
      }
    },
    {
      "id": "field_1761212788331",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 139.8515625,
        "y": 52.32421875,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761212788331
      },
      "position": 4,
      "page_number": 2,
      "setting": {
        "type": "system_sign_date"
      }
    },
    {
      "id": "field_1761212791171",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 141.5703125,
        "y": 201.08984375,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761212791171
      },
      "position": 5,
      "page_number": 2,
      "setting": {
        "type": "system_cccd_address"
      }
    },
    {
      "id": "field_1761212794102",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 175.75390625,
        "y": 298.15625,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761212794102
      },
      "position": 6,
      "page_number": 2,
      "setting": {
        "type": "dropdown_select",
        "title": "Ngân hàng sử dụng nhận thưởng",
        "options": [
          "Ngân hàng TMCP Á Châu (ACB)",
          "Ngân hàng TPBank"
        ]
      }
    },
    {
      "id": "field_1761212797866",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 189.07421875,
        "y": 86.69140625,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761212797866
      },
      "position": 7,
      "page_number": 2,
      "setting": {
        "type": "free_text",
        "title": "Hệ thống - Số CCCD khi xác thực",
        "answer_type": "min",
        "min_char": "123",
        "max_char": "",
        "confirm_type": "number",
        "min_value": "",
        "max_value": ""
      }
    },
    {
      "id": "field_1761212801946",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 180.078125,
        "y": 578.3515625,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761212801946
      },
      "position": 8,
      "page_number": 2
    },
    {
      "id": "field_1761212807351",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 113.9765625,
        "y": 123.3671875,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761212807351
      },
      "position": 9,
      "page_number": 9,
      "setting": {
        "type": "free_text",
        "title": "A Signature",
        "answer_type": "min",
        "min_char": "123",
        "max_char": "",
        "confirm_type": "number",
        "min_value": "",
        "max_value": ""
      }
    },
    {
      "id": "field_1761212810908",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 351.36328125,
        "y": 121.94921875,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761212810908
      },
      "position": 10,
      "page_number": 9,
      "setting": {
        "type": "free_text",
        "title": "B Signature",
        "answer_type": "min",
        "min_char": "123",
        "max_char": "",
        "confirm_type": "number",
        "min_value": "",
        "max_value": ""
      }
    },
    {
      "id": "field_1761212827224",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 117.75390625,
        "y": 529.31640625,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761212827224
      },
      "position": 11,
      "page_number": 1,
      "setting": {
        "type": "base_customer_code"
      }
    },
    {
      "id": "field_1761212833038",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 117.984375,
        "y": 563.90234375,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761212833038
      },
      "position": 12,
      "page_number": 1,
      "setting": {
        "type": "system_cccd_address"
      }
    },
    {
      "id": "field_1761212837302",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 123.73828125,
        "y": 624.859375,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761212837302
      },
      "position": 13,
      "page_number": 1,
      "setting": {
        "type": "system_cccd_number"
      }
    }
  ],
  "ts": "2025-10-23T11:56:01.560Z",
  "version": "1.0"
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout/>,
    errorElement: <NotFound/>,
    children: [
      {
        index: true,
        element: <AppPoc/>,
      },
      {
        path: "pdf",
        element: <PDFSetting
          pdfUrl={'https://cdn.jsdelivr.net/gh/phongnguyen-ndsvn/cdn-storage@main/HDPDFEmpty.docx.pdf'}
          settingData={settingDataExample}
          attributes={[
            {label: "Mã khách hàng", value: "customer_code"},
            {label: "Tên khách hàng", value: "customer_name"},
            {label: "Địa chỉ khách hàng", value: "customer_address"},
          ]}
          onSaveSetting={function (data: PDFSettingData): void {
            console.log(`👨‍🎓 PhongNguyen 🎯 routes.tsx 👉 setting data 📝:`, data)
          }}
          onChangeSetting={function (data: PDFSettingData): void {
            console.log(`👨‍🎓 PhongNguyen 🎯 routes.tsx 👉 onchange data 📝:`, data)
          }}
          config={{
            enablePDFFillerToolBox: false,
            enableExportToolBox: false,
            enablePDFViewerToolBar: false
          }}
        />,
      },
      {
        path: "*",
        element: <NotFound/>,
      },
    ],
  },
]);
