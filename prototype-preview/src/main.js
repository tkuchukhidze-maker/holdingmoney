import { mountScreen, renderIndex } from './dc-runtime.js';

const screen = new URLSearchParams(location.search).get('screen');
if (screen) mountScreen(screen);
else renderIndex();
