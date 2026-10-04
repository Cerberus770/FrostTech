/* eslint-disable @typescript-eslint/no-explicit-any */
interface Window {
  google: {
    accounts: {
      id: {
        initialize: (config: any) => void;
        renderButton: (element: HTMLElement, config: any) => void;
        prompt: () => void;
      };
    };
  };
}
