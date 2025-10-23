import {createBrowserRouter,} from "react-router";
import RootLayout from "./root";
import AppPoc from "../modules/docs-setting/poc/App";
import PDFSetting from "../modules/docs-setting/pdf/pdf.ui";
import NotFound from "./not-found";
import { PDFSettingData } from "../modules/docs-setting/pdf/types/pdf-setting.type";

const settingDataExample: PDFSettingData = {
  "name": "HDPDFEmpty.docx.pdf",
  "form_fields": [
    {
      "id": "field_1761109832026",
      "box": {
        "x": 122.81640625,
        "y": 302.796875,
        "width": 363,
        "height": 31,
      },
      "meta": {
        "label": "a_alias",
        "name": "a_alias",
        "required": false,
        "placeholder": "",
        "ts": -1,
        "type": "text",
      },
      "font_size": 12,
      "color": "#000000",
      "page_number": 1,
      "position": 1
    }
  ],
  "ts": "2025-10-23T01:19:03.894Z",
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
          onSaveSetting={function (data: PDFSettingData): void {
            console.log(`👨‍🎓 PhongNguyen 🎯 routes.tsx 👉 setting data 📝:`, data)
          }} />,
      },
      {
        path: "*",
        element: <NotFound/>,
      },
    ],
  },
]);
