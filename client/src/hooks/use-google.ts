// Google Sheets API Config
export const CLIENT_ID = "868922513131-mlscb7f454ec2ksk1nk4rcne9v80r9m6.apps.googleusercontent.com"; // e.g., 123456789012-abc.apps.googleusercontent.com
export const SPREADSHEET_ID = "1Mu5sCb69UXM4ke2ppFWaAgtt2xIuyGxQOurKVTa_bu4"; // e.g., 1zwblTR5DWzgOiVxsDYJJkP5Gcmi4OGiCtldI0nyxZGo
export const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

// GIS Token Client
export let tokenClient: google.accounts.oauth2.TokenClient | null = null;
export let accessToken: string | null = null;
export let isGisInitialized = false;

// Initialize Google API client (Sheets API only)
export const initializeGapiClient = () => {
  if (!window.gapi) {
    console.error("GAPI initialization failed: GAPI is not loaded");
    throw new Error("GAPI is not loaded");
  }


  return new Promise<void>((resolve, reject) => {
    window.gapi.load("client", () => {
      window.gapi.client
        .init({
          // apiKey: API_KEY,
          discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        })
        .then(() => {
          console.log("GAPI client initialized successfully");
          resolve();
        })
        .catch((error: any) => {
          console.error("GAPI initialization failed:", error);
          console.error("Error details:", error.details || error.message || error);
          reject(error);
        });
    });
  });
};

export const initializeGisClient = () => {
  if (isGisInitialized) {
    console.log("GIS client already initialized");
    return Promise.resolve();
  }
  if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
    console.error("GIS initialization failed: Google Identity Services not loaded");
    return Promise.reject(new Error("Google Identity Services not loaded"));
  }
  return new Promise<void>((resolve, reject) => {
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: google.accounts.oauth2.TokenResponse) => {
          if (response.error) {
            console.error("GIS token error:", response);
            return; // Handle error in signIn
          }
          accessToken = response.access_token;
          console.log("GIS token obtained:", accessToken);
        },
      });
      isGisInitialized = true;
      console.log("GIS client initialized");
      resolve();
    } catch (error) {
      console.error("GIS initialization error:", error);
      reject(error);
    }
  });
};

// Sign in with GIS
export const signIn = () => {
  if (!tokenClient) {
    console.error("Sign-in failed: GIS token client not initialized");
    return initializeGisClient().then(() => signIn()); // Retry after initializing
  }
  return new Promise<void>((resolve, reject) => {
    tokenClient.requestAccessToken({
      prompt: "select_account",
    });
    const checkToken = (attempts = 0) => {
      if (accessToken) {
        console.log("Sign-in successful");
        resolve();
      } else if (attempts > 50) { // Timeout after ~5 seconds
        reject(new Error("Sign-in timed out"));
      } else {
        setTimeout(() => checkToken(attempts + 1), 100);
      }
    };
    checkToken();
  }).catch((error) => {
    console.error("Sign-in error:", error);
    throw error;
  });
};

// Check if signed in
export const isSignedIn = () => {
  const signedIn = !!accessToken;
  console.log("isSignedIn:", signedIn);
  return signedIn;
};


