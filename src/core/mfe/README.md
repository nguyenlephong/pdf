# 🧩 Micro Frontend (MFE) Integration Guide

> **MFE (Micro Frontend)** is a design pattern that decomposes a large front-end application into smaller, semi-independent "microapps" that can be developed, deployed, and scaled independently.  
> This document explains how to integrate and use MFE modules in your Angular project via the `MicroAppLoaderService`.

---

## 🚀 Key Features

- **Independent Development** — Each microapp can be built and deployed separately.
- **Technology Agnostic** — Mix different stacks (Angular, React, Vue, etc.).
- **Scalable & Maintainable** — Load only what you need; each module has isolated dependencies.
- **Secure Isolation** — Support for Shadow DOM and Iframe sandboxing.
- **Lifecycle Management** — Load, mount, unmount, and clean up microapps dynamically.
- **Props & Events Support** — Easily pass data and callback functions between host and microapp.

---

## 🛠️ Setup

### 1️⃣ Configure Micro Apps

Create a configuration file (e.g. `micro-app.config.ts`):

```ts
export interface MicroAppConfig {
  name: string;
  containerId: string;
  url: string | string[];
  css?: string[];
  sandbox?: boolean;
  shadow?: boolean;
  allowSameOrigin?: boolean;
  mountFn: string;
  unmountFn: string;
}

export const MICRO_APPS: Record<string, MicroAppConfig> = {
  PDFDocsSetting: {
    name: 'PDFDocsSetting',
    containerId: 'react-root',
    url: ['/assets/docs-setting/pdf-docs-setting.umd.js'],
    css: ['/assets/docs-setting/pdf-docs-setting.css'],
    sandbox: false,
    shadow: false,
    allowSameOrigin: false,
    mountFn: 'mount',
    unmountFn: 'unmount',
  },
};
```

### 2️⃣ Import & Provide the Service

In your Angular module (e.g. app.module.ts):

```ts
import { MicroAppLoaderService } from '~/core/mfe/micro-app-loader.service';

@NgModule({
  providers: [MicroAppLoaderService],
})
export class AppModule {}
```

### 3️⃣ Load Micro App in Component

<details>
<summary>View source detail</summary>


```ts
import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { MicroAppLoaderService } from '~/core/mfe/micro-app-loader.service';

@Component({
  selector: 'app-docs-setting',
  template: `<div id="react-root" style="height:100%;width:100%"></div>`,
})
export class DocsSettingComponent implements OnInit, OnDestroy {
  constructor(
    private el: ElementRef,
    private microLoader: MicroAppLoaderService
  ) {}

  async ngOnInit() {
    const container = this.el.nativeElement.querySelector('#mapp-pdf-docs-setting-root');
    await this.microLoader.load('PDFDocsSetting', container, {
      pdfUrl: 'https://cdn.jsdelivr.net/gh/phongnguyen-ndsvn/cdn-storage@main/HDPDFEmpty.docx.pdf',
      settingData: {
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
      },
      attributes: [
        {label: "Mã khách hàng", value: "customer_code"},
        {label: "Tên khách hàng", value: "customer_name"},
        {label: "Tuổi khách hàng", value: "customer_age"},
        {label: "Địa chỉ khách hàng", value: "customer_address"},
      ],
      onChangeSetting: (data: any) => {
        console.log('📗 onChangeSetting:', data);
      },
      onSaveSetting: (data: any) => {
        console.log('💾 onSaveSetting:', data);
      },
    });
  }

  ngOnDestroy() {
    this.microLoader.unmount('PDFDocsSetting');
  }
}
```
</details>


## ⚙️ Available Configuration Options

| Key | Type | Default | Description |
|-----|------|----------|-------------|
| `name` | `string` | — | Global namespace of microapp (must match `window[name]` in bundle). |
| `containerId` | `string` | — | The element ID to mount the microapp into. |
| `url` | `string or string[]` | — | Path(s) to JS bundle(s). |
| `css` | `string[]` | `[]` | Optional list of CSS files to include. |
| `sandbox` | `boolean` | `false` | If `true`, loads inside an `<iframe>` for strict isolation. |
| `shadow` | `boolean` | `false` | If `true`, mounts microapp within a Shadow DOM root for style encapsulation. |
| `allowSameOrigin` | `boolean` | `false` | Allows shared cookies & localStorage (use with caution). |
| `mountFn` | `string` | `'mount'` | Entry method to initialize the app. |
| `unmountFn` | `string` | `'unmount'` | Method to destroy/unmount the app. |

---

## 🔒 Security Considerations

When integrating third-party or remote micro frontends:
- ✅ Always host bundles from **trusted sources** or your own CDN.
- ✅ Use **sandbox mode** (`iframe`) for untrusted content.
- ✅ Avoid passing sensitive data directly through props; prefer API calls.
- ⚠️ Validate all events & messages before execution.
- ⚙️ Consider implementing a **message bridge** if sandboxed (`postMessage`).


---

## 💡 Advanced Tips

- For **local development**, you can bypass CDN and load from `localhost` by adding in config:
  ```ts
  url: process.env.NODE_ENV === 'development'
    ? ['http://localhost:5173/pdf-docs-setting.umd.js']
    : ['/assets/docs-setting/pdf-docs-setting.umd.js']
  ```

  •	For React/Vue microapps, ensure to expose global functions like:
    ```ts
    (window as any).PDFDocsSetting = {
        mount: (containerId, props) => { /* render */ },
        unmount: (containerId) => { /* cleanup */ },
    };
    ```