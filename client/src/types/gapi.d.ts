interface GapiClient {
    init: (config: {
      apiKey?: string;
      discoveryDocs: string[];
    }) => Promise<void>;
    load: (api: string, callback: () => void) => void;
    client: {
      sheets: {
        spreadsheets: {
          values: {
            get: (params: { spreadsheetId: string; range: string; access_token?: string }) => Promise<{
              result: { values?: any[][] };
            }>;
            update: (params: {
              spreadsheetId: string;
              range: string;
              valueInputOption: string;
              access_token?: string;
              resource: { values: any[][] };
            }) => Promise<void>;
            append: (params: {
              spreadsheetId: string;
              range: string;
              valueInputOption: string;
              access_token?: string;
              resource: { values: any[][] };
            }) => Promise<void>;
          };
        };
      };
    };
  }
  
  declare global {
    interface Window {
      gapi: {
        load: (api: string, callback: () => void) => void;
        client: GapiClient;
      };
      google: {
        accounts: {
          oauth2: {
            initTokenClient: (config: {
              client_id: string;
              scope: string;
              callback: (response: { access_token: string; error?: string }) => void;
            }) => google.accounts.oauth2.TokenClient;
          };
        };
      };
    }
  
    namespace google.accounts.oauth2 {
      interface TokenClient {
        requestAccessToken: (options?: { prompt?: string }) => void;
      }
    }
  }