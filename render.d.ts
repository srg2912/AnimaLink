export {};

declare global {
  interface Window {
    electronAPI: {
      openModdingFolder: () => void;
    };
  }
}