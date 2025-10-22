import {createBrowserRouter,} from "react-router";
import RootLayout from "./root";
import AppPoc from "../modules/docs-setting/poc/App";
import PDFSetting from "../modules/docs-setting/pdf/pdf.ui";
import NotFound from "./not-found";

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
        element: <PDFSetting/>,
      },
      {
        path: "*",
        element: <NotFound/>,
      },
    ],
  },
]);
