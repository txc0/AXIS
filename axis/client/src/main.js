import './styles/base.css';
import './styles/home.css';
import './styles/pages.css';
import { initLayout } from './components/layout.js';
import { startRouter } from './router.js';

initLayout();
startRouter();