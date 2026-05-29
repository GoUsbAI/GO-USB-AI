import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("go-usb-aiCompanion", {
  open: () => ipcRenderer.invoke("companion:open"),
  quit: () => ipcRenderer.invoke("companion:quit"),
  getBootstrap: () => ipcRenderer.invoke("companion:get-bootstrap")
});
