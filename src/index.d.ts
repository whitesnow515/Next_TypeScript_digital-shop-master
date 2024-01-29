declare global {
  interface Window {
    captchaToken: string;
    showCrisp?: boolean;
    ApexCharts: ApexCharts;
    turnstile: {
      // just some of the types
      reset: () => void;
      render: (
        element?: HTMLElement | null,
        options?: {
          sitekey: string;
          callback: (token: string) => void;
          tabindex?: number;
          action?: string;
        }
      ) => void;
      ready: (callback: () => void) => void;
    };
  }
}

export {};
