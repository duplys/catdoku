import './styles/main.css';
import { startApp } from './app';
const app = document.querySelector<HTMLElement>('#app');
if (app) startApp(app);
