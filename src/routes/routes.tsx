import {createBrowserRouter,} from "react-router";
import RootLayout from "./root";
import AppPoc from "../modules/docs-setting/poc/App";
import PDFSetting from "../modules/docs-setting/pdf/pdf.ui";
import NotFound from "./not-found";
import {PDFSettingData} from "../modules/docs-setting/pdf/types/pdf-setting.type";

// @ts-ignore
import {DEFAULT_SETTING_JSON} from "@/modules/docs-setting/pdf/pdf.const.ts";


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
          pdfUrl={'rtqc.blob.core.windows.net/bbs-qc-file-container/signed-documents/0098bd33-e980-4d6b-aff2-629c7b60b288_b44e25e0-a8b6-11f0-9aaf-b1b717c9194b.pdf' || 'https://cdn.jsdelivr.net/gh/phongnguyen-ndsvn/cdn-storage@main/HDPDFEmpty.docx.pdf'}
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
            enablePDFFillerToolBox: false,
            enableExportToolBox: false,
            enablePDFViewerToolBar: false,
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
