export const authStatusPayload = {
  enabled: false,
  configured: false,
  authenticated: false,
  username: 'demo'
};

export const remoteStatusPayload = {
  account: { loggedIn: false, email: '', username: null, role: 'member', platformBase: 'https://platform.go-usb-ai.io', apiBase: 'https://platform-api.go-usb-ai.io' },
  settings: { enabled: false, deviceName: 'Screenshot Mac', platformApiBase: 'https://platform-api.go-usb-ai.io' },
  service: { running: true, pid: 55231, uiUrl: 'http://127.0.0.1:5194', uiPort: 5194, currentProcess: true },
  localOrigin: 'http://127.0.0.1:5194',
  configuredEnabled: false,
  platformBase: 'https://platform.go-usb-ai.io',
  runtime: {
    enabled: false,
    mode: 'foreground',
    state: 'disabled',
    deviceId: 'screenshot-device',
    deviceName: 'Screenshot Mac',
    platformBase: 'https://platform.go-usb-ai.io',
    localOrigin: 'http://127.0.0.1:5194',
    lastConnectedAt: null,
    lastError: null,
    updatedAt: '2026-04-16T00:00:00.000Z'
  }
};
