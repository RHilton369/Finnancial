import { contextBridge, ipcRenderer } from 'electron'

// Expondo de forma segura os comandos do processo Main para o Frontend
contextBridge.exposeInMainWorld('electronAPI', {
  // Você pode adicionar métodos aqui para que o React evoque eventos do Desktop se quiser depois.
})
