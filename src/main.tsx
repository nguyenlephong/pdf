// =====> Deployment <=====
import React from "react";
import './index.css'

export * from './modules/docs-setting/pdf/loader';


// // ====> Simulation <=====
// import {mount} from './modules/docs-setting/pdf/loader';
// import {PDFSettingData} from "@/modules/docs-setting/pdf/types/pdf-setting.type";
//
// function simulationShadow() {
//   // ---- Auto detect if running standalone (Vite dev) ----
//   const defaultContainer = document.getElementById('root');
//   if (defaultContainer) {
//     console.log('🌈 Running in standalone dev mode — using Shadow DOM');
//     mount(defaultContainer, {
//       pdfUrl: 'rtqc.blob.core.windows.net/bbs-qc-file-container/signed-documents/0098bd33-e980-4d6b-aff2-629c7b60b288_b44e25e0-a8b6-11f0-9aaf-b1b717c9194b.pdf' || 'https://cdn.jsdelivr.net/gh/phongnguyen-ndsvn/cdn-storage@main/HDPDFEmpty.docx.pdf',
//       settingData: undefined,
//       attributes: [
//         {label: "Mã khách hàng", value: "customer_code"},
//         {label: "Tên khách hàng", value: "customer_name"},
//         {label: "Địa chỉ khách hàng", value: "customer_address"},
//       ],
//       onSaveSetting: function (data: PDFSettingData): void {
//           console.log(`👨‍🎓 PhongNguyen 🎯 routes.tsx 👉 setting data 📝:`, data)
//       },
//       config: {
//         enablePDFFillerToolBox: false,
//         enableExportToolBox: false,
//         enablePDFViewerToolBar: false,
//         enableLogger: true,
//         lang: "vi"
//       }
//     });
//   }
// }
//
// simulationShadow()


// =====> Note Development <======
// import React from "react";
// import {createRoot} from 'react-dom/client'
// import './index.css'
// import {RouterProvider} from "react-router";
// import {router} from "./routes/routes";
//
// export * from './modules/docs-setting/pdf/loader';
//
// createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <RouterProvider router={router} />
//   </React.StrictMode>
// );


