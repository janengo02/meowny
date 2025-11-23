import { Menu } from 'electron';
import { isDev } from './util.js';

export function createMenu() {
  const isDevMode = isDev();
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Meowny',
      submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        ...(isDevMode ? [{ role: 'toggleDevTools' } as const] : []),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
