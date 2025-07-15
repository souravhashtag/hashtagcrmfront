export {};

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, data: any) => void;
        // You can add more functions here as needed
      };
    };
  }
}