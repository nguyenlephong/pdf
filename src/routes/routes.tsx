import {createBrowserRouter,} from "react-router";
import RootLayout from "./root";
import AppPoc from "../modules/docs-setting/poc/App";
import PDFSetting from "../modules/docs-setting/pdf/pdf.ui";
import NotFound from "./not-found";
import {PDFSettingData} from "../modules/docs-setting/pdf/types/pdf-setting.type";

const setting: PDFSettingData = {
  "name": "config.json",
  "form_fields": [
    {
      "id": "field_1761395349916",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 109.4568086935167,
        "y": 305.45048501964635,
        "width": 394.0785854616896,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395349916
      },
      "position": 1,
      "page_number": 1,
      "setting": {
        "title": "123",
        "answer_type": "min",
        "min_char": "123435",
        "max_char": "",
        "confirm_type": "number",
        "min_value": "",
        "max_value": "",
        "type": "free_text"
      }
    },
    {
      "id": "field_1761395354484",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 174.61425589390961,
        "y": 299.8238273575638,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395354484
      },
      "position": 2,
      "page_number": 2,
      "setting": {
        "title": "3",
        "answer_type": "min",
        "min_char": "4",
        "max_char": "",
        "confirm_type": "number",
        "min_value": "",
        "max_value": "",
        "type": "free_text"
      }
    },
    {
      "id": "field_1761395523241",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 158.03487229862475,
        "y": 338.20533521611003,
        "width": 342.37721021611003,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395523241
      },
      "position": 3,
      "page_number": 1,
      "setting": {
        "title": "345",
        "answer_type": "min",
        "min_char": "345",
        "max_char": "",
        "confirm_type": "number",
        "min_value": "",
        "max_value": "",
        "type": "free_text"
      }
    },
    {
      "id": "field_1761395527261",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 115.08346635559921,
        "y": 368.7057649803536,
        "width": 385.6620825147347,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395527261
      },
      "position": 4,
      "page_number": 1,
      "setting": {
        "title": "324",
        "answer_type": "min",
        "min_char": "4",
        "max_char": "",
        "confirm_type": "number",
        "min_value": "",
        "max_value": "",
        "type": "free_text"
      }
    },
    {
      "id": "field_1761395542881",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 307.803536345776,
        "y": 274.23661591355597,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395542881
      },
      "position": 5,
      "page_number": 1,
      "setting": {
        "title": "sdf",
        "answer_type": "min",
        "min_char": "234",
        "max_char": "",
        "confirm_type": "number",
        "min_value": "",
        "max_value": "",
        "type": "free_text"
      }
    },
    {
      "id": "field_1761395544903",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 110.87991159135562,
        "y": 401.16472249508837,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395544903
      },
      "position": 6,
      "page_number": 1,
      "setting": {
        "type": "system_sign_date"
      }
    },
    {
      "id": "field_1761395555250",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 126.21466723968565,
        "y": 432.7641822200393,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395555250
      },
      "position": 7,
      "page_number": 1,
      "setting": {
        "type": "base_customer_code"
      }
    },
    {
      "id": "field_1761395562658",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 130.7986554518664,
        "y": 52.83797888015717,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395562658
      },
      "position": 8,
      "page_number": 2,
      "setting": {
        "type": "system_cccd_address"
      }
    },
    {
      "id": "field_1761395565529",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 188.71847372298626,
        "y": 87.8237659626719,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395565529
      },
      "position": 9,
      "page_number": 2,
      "setting": {
        "type": "system_cccd_number"
      }
    },
    {
      "id": "field_1761395569694",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 142.27271611001964,
        "y": 202.97768295677798,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395569694
      },
      "position": 10,
      "page_number": 2,
      "setting": {
        "type": "base_customer_name"
      }
    },
    {
      "id": "field_1761395572497",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 206.1996254911591,
        "y": 235.26755893909626,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395572497
      },
      "position": 11,
      "page_number": 2,
      "setting": {
        "type": "system_cccd_name"
      }
    },
    {
      "id": "field_1761395579570",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 425.9445604125736,
        "y": 288.9697323182711,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395579570
      },
      "position": 12,
      "page_number": 3,
      "setting": {
        "type": "base_customer_code"
      }
    },
    {
      "id": "field_1761395586430",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 255.23326989194499,
        "y": 248.1647224950884,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395586431
      },
      "position": 13,
      "page_number": 4,
      "setting": {
        "type": "system_cccd_name"
      }
    },
    {
      "id": "field_1761395591387",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 259.8877087426326,
        "y": 282.14541380157175,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395591387
      },
      "position": 14,
      "page_number": 4,
      "setting": {
        "type": "system_cccd_address"
      }
    },
    {
      "id": "field_1761395597008",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 140.31888506876228,
        "y": 394.5376657662082,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395597008
      },
      "position": 15,
      "page_number": 5,
      "setting": {
        "type": "base_customer_name"
      }
    },
    {
      "id": "field_1761395602745",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 299.69231949901763,
        "y": 166.10851547151276,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395602745
      },
      "position": 16,
      "page_number": 6,
      "setting": {
        "type": "base_customer_name"
      }
    },
    {
      "id": "field_1761395611083",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 191.50831900785852,
        "y": 185.65152259332024,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395611083
      },
      "position": 17,
      "page_number": 7,
      "setting": {
        "type": "base_customer_code"
      }
    },
    {
      "id": "field_1761395616133",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 192.76703708251472,
        "y": 181.59826252455795,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395616133
      },
      "position": 18,
      "page_number": 8,
      "setting": {
        "type": "customer_code"
      }
    },
    {
      "id": "field_1761395620053",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 108.87441674852653,
        "y": 376.82167853634576,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395620053
      },
      "position": 19,
      "page_number": 8,
      "setting": {
        "title": "Banks",
        "options": [
          "TPbank",
          "VIB"
        ],
        "type": "dropdown_select"
      }
    },
    {
      "id": "field_1761395625499",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 106.99573305500982,
        "y": 122.65925834970528,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395625499
      },
      "position": 20,
      "page_number": 9,
      "setting": {
        "title": "sign a",
        "answer_type": "exact",
        "min_char": "24",
        "max_char": "42",
        "confirm_type": "number",
        "min_value": "",
        "max_value": "",
        "type": "free_text"
      }
    },
    {
      "id": "field_1761395630432",
      "font_size": 16,
      "color": "#000000",
      "box": {
        "x": 329.65732441060896,
        "y": 123.46239562868367,
        "width": 150,
        "height": 30
      },
      "meta": {
        "type": "text",
        "label": "",
        "name": "",
        "required": false,
        "placeholder": "",
        "ts": 1761395630432
      },
      "position": 21,
      "page_number": 9,
      "setting": {
        "title": "sign b",
        "answer_type": "confirm",
        "min_char": "",
        "max_char": "",
        "confirm_type": "email",
        "min_value": "",
        "max_value": "",
        "type": "free_text"
      }
    }
  ],
  "ts": "2025-10-25T12:38:43.532Z",
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
          settingData={undefined}
          attributes={[
            {label: "Mã khách hàng", value: "customer_code"},
            {label: "Tên khách hàng", value: "customer_name"},
            {label: "Địa chỉ khách hàng", value: "customer_address"},
          ]}
          onSaveSetting={function (data: PDFSettingData): void {
            console.log(`👨‍🎓 PhongNguyen 🎯 routes.tsx 👉 setting data 📝:`, data)
          }}
          config={{
            enablePDFFillerToolBox: true,
            enableExportToolBox: true,
            enablePDFViewerToolBar: true,
            enableLogger: true,
            lang: "vi"
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
