import {createRoot} from 'react-dom/client'
import './index.css'
import AppPoc from './modules/docs-setting/poc/App';

export * from './modules/docs-setting/pdf/loader';

// @ts-ignore
createRoot(document.getElementById('root')!).render(<AppPoc {...{}}/>);