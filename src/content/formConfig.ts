export interface SingleFormConfig {
  enabled: boolean;
  strategy: string;
  endpointEnv?: string;
  requirePrivacyConsent: boolean;
  maxMessageLength?: number;
  providerEnvPrefix?: string;
}

export interface FormsConfig {
  contact: SingleFormConfig;
  newsletter: SingleFormConfig;
}

export const defaultFormsConfig: FormsConfig = {
  contact: {
    enabled: false,
    strategy: "mailto",
    requirePrivacyConsent: true,
    maxMessageLength: 4000,
  },
  newsletter: {
    enabled: false,
    strategy: "webhook",
    requirePrivacyConsent: true,
  },
};
