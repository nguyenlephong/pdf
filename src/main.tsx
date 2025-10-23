// import React from "react";
// // import {createRoot} from 'react-dom/client'
// import './index.css'
// // import {RouterProvider} from "react-router";
// // import {router} from "./routes/routes";
//
// export * from './modules/docs-setting/pdf/loader';
//
// // createRoot(document.getElementById("root")!).render(
// //   <React.StrictMode>
// //     <RouterProvider router={router} />
// //   </React.StrictMode>
// // );


import React from "react";
import {createRoot} from 'react-dom/client'
import './index.css'
import {RouterProvider} from "react-router";
import {router} from "./routes/routes";

export * from './modules/docs-setting/pdf/loader';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);