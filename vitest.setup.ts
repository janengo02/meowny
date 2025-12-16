import { vi } from 'vitest';

// Mock Electron module
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/path'),
    getVersion: vi.fn(() => '1.0.0'),
    on: vi.fn(),
    whenReady: vi.fn(() => Promise.resolve()),
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
  BrowserWindow: vi.fn(),
}));

// Mock electron-log
vi.mock('electron-log', () => ({
  default: {
    transports: {
      file: {
        resolvePathFn: null,
        level: 'debug',
        format: '',
        maxSize: 0,
      },
      console: {
        level: 'debug',
        format: '',
      },
    },
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
