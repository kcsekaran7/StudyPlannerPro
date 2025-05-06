import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Task, TaskStatus } from "@shared/schema";


// Google Sheets API Config
const CLIENT_ID = "868922513131-mlscb7f454ec2ksk1nk4rcne9v80r9m6.apps.googleusercontent.com"; // e.g., 123456789012-abc.apps.googleusercontent.com
const SPREADSHEET_ID = "1Mu5sCb69UXM4ke2ppFWaAgtt2xIuyGxQOurKVTa_bu4"; // e.g., 1zwblTR5DWzgOiVxsDYJJkP5Gcmi4OGiCtldI0nyxZGo
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";


const normalizeStatus = (status: string): TaskStatus => {
  const statusMap: Record<string, TaskStatus> = {
    'completed': 'completed',
    'Completed': 'completed',
    'partial': 'partial',
    'Partial': 'partial',
    'not_started': 'not_started',
    'Not Started': 'not_started',
    'not_needed': 'not_needed',
    'Not Needed': 'not_needed',
  };
  const normalized = statusMap[status] || 'not_started';
  console.log('Normalizing status:', status, '->', normalized);
  return normalized;
};

// Helper to adapt CSV row to Task
const adaptTask = (row: any[]): Task => {
 const taskData = {
    id: row[0], // Column A
    title: row[1], // Column B
    description: row[2], // Column C
    subject: row[3], // Column D
    duration: row[4], // Column E
    resources: row[5], // Column F
    cloudId: row[6], // Column G
    status: row[7], // Column H
    scheduledDate: row[8], // Column I
  };

  // Validate required fields
  if (
    !taskData.id ||
    !taskData.title ||
    !taskData.subject ||
    !taskData.duration ||
    !taskData.cloudId ||
    !taskData.scheduledDate
  ) {
    console.warn('Invalid CSV row:', row);
    throw new Error('Missing required CSV fields');
  }
 
  const task:Task =  {
    id: parseInt(taskData.id),
    title: taskData.title,
    description: taskData.description || undefined,
    subject: taskData.subject,
    duration: parseInt(taskData.duration),
    resources: taskData.resources || undefined,
    cloudId: taskData.cloudId,
    status: taskData.status as TaskStatus,
    scheduledDate: taskData.scheduledDate
  };

  // Additional validation (optional)
  if (isNaN(task.id) || isNaN(task.duration)) {
    console.warn('Invalid numeric values in row:', row);
    throw new Error('Invalid numeric fields in CSV row');
  }

  console.log('Adapted Task:', task);
  return task;
};


// GIS Token Client
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: string | null = null;
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

export const signOut = () => {
  const queryClient = useQueryClient();
  accessToken = null;
  queryClient.invalidateQueries({ queryKey: ["google-sheet-tasks"] });
  console.log("Signed out, accessToken cleared");
};

// Check if signed in
export const isSignedIn = () => {
  const signedIn = !!accessToken;
  console.log("isSignedIn:", signedIn);
  return signedIn;
};

// Fetch all tasks from Google Sheet CSV
export const useAllTasks = () => {
  return useQuery<Task[]>({
    queryKey: ['google-sheet-tasks'],
    queryFn: async () => {
      if (!isGisInitialized) {
        await initializeGisClient();
      }
      if (!isSignedIn()) {
        await signIn();
      }
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Tasks!A2:I", 
      });
      console.log("Sheets API response:", response.result);

      const values = response.result.values || [];
      if (!values.length) {
        console.log("No tasks found");
        return [];
      }

      const tasks: Task[] = [];
      values.forEach((row, index) => {
        try {
          const task = adaptTask(row);
          tasks.push(task);
        } catch (error) {
          console.warn(`Skipping invalid row at index ${index + 2}:`, row, error);
        }
      });

      console.log("Parsed tasks:", tasks);
      return tasks;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled:!!window.gapi && !!window.gapi.client,
  });
};


// Fetch tasks by date from Google Sheet
export const useTasksByDate = (date: Date) => {
  const formattedDate = format(date, "yyyy-MM-dd");
  return useQuery<Task[]>({
    queryKey: ["google-sheet-tasks", formattedDate],
    queryFn: async () => {
      if (!isGisInitialized) {
        await initializeGisClient();
      }
      if (!isSignedIn()) {
        await signIn();
      }
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Tasks!A2:I", // Adjust range
      });
      console.log("Sheets API response:", response.result);
      const values = response.result.values || [];
      if (!values.length) {
        console.log("No tasks found");
        return [];
      }
      const tasks: Task[] = [];
      values.forEach((row, index) => {
        try {
          const task = adaptTask(row);
          if (task.scheduledDate === formattedDate) {
            tasks.push(task);
          }
        } catch (error) {
          console.warn(`Skipping invalid row at index ${index + 2}:`, row, error);
        }
      });

      console.log(`Filtered tasks for ${formattedDate}:`, tasks);
      return tasks;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!window.gapi && !!window.gapi.client,
  });
};

// Update task status in Google Sheet
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: TaskStatus }) => {
      if (!isGisInitialized) {
        await initializeGisClient();
      }
      if (!isSignedIn()) {
        await signIn();
      }
      console.log("useUpdateTaskStatus: Updating:", { taskId, status });
      // Find the row for taskId
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Tasks!A2:I",
      });
      const values = response.result.values || [];
      const rowIndex = values.findIndex((row) => parseInt(row[0]) === taskId);
      if (rowIndex === -1) {
        throw new Error(`Task ${taskId} not found`);
      }
      // Update status column (assuming status is column H, index 7)
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Tasks!H${rowIndex + 2}`, // 1-based, offset for header
        valueInputOption: "RAW",
        resource: { values: [[status]] },
      });
      console.log("useUpdateTaskStatus: Status updated");
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["google-sheet-tasks"] });
      const previousAllTasks = queryClient.getQueryData<Task[]>(["google-sheet-tasks"]);
      queryClient.setQueryData<Task[]>(["google-sheet-tasks"], (old) =>
        old?.map((task) => (task.id === taskId ? { ...task, status } : task))
      );
      const previousDateTasks: { [key: string]: Task[] } = {};
      queryClient.getQueriesData<Task[]>({ queryKey: ["google-sheet-tasks"] }).forEach(([queryKey, data]) => {
        if (queryKey[1] && data) {
          previousDateTasks[queryKey[1] as string] = data;
          queryClient.setQueryData<Task[]>(queryKey, (old) =>
            old?.map((task) => (task.id === taskId ? { ...task, status } : task))
          );
        }
      });
      console.log("useUpdateTaskStatus: Optimistic update applied for taskId:", taskId, "status:", status);
      return { previousAllTasks, previousDateTasks };
    },
    onError: (error, { taskId }, context) => {
      console.error("useUpdateTaskStatus: Mutation failed:", error);
      queryClient.setQueryData(["google-sheet-tasks"], context?.previousAllTasks);
      Object.entries(context?.previousDateTasks || {}).forEach(([date, tasks]) => {
        queryClient.setQueryData(["google-sheet-tasks", date], tasks);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["google-sheet-tasks"] });
    },
  });
};

// Sync tasks (for adding new tasks)
export const useSyncTasks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      if (!isGisInitialized) {
        await initializeGisClient();
      }
      if (!isSignedIn()) {
        console.log("User not signed in, prompting sign-in");
        await signIn();
      }
      console.log("useSyncTasks: Processing task:", task);
      const values = [
        [
          task.id || Math.floor(Math.random() * 1000000), // Generate ID if missing
          task.title || "",
          task.description || "",
          task.subject || "",
          task.duration || 0,
          task.resources || "",
          task.cloudId || `cloud_${Date.now()}`,
          task.status || "not_started",
          task.scheduledDate || format(new Date(), "yyyy-MM-dd"),
        ],
      ];
      if (task.id) {
        // Update existing task
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: "Tasks!A2:I",
          access_token: accessToken!,
        });
        const valuesAll = response.result.values || [];
        const rowIndex = valuesAll.findIndex((row) => parseInt(row[0]) === task.id);
        if (rowIndex === -1) {
          throw new Error(`Task ${task.id} not found`);
        }
        await window.gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `Tasks!A${rowIndex + 2}:I${rowIndex + 2}`,
          valueInputOption: "RAW",
          access_token: accessToken!,
          resource: { values },
        });
        console.log("useSyncTasks: Task updated");
      } else {
        // Add new task
        await window.gapi.client.sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: "Tasks!A2:I",
          valueInputOption: "RAW",
          access_token: accessToken!,
          resource: { values },
        });
        console.log("useSyncTasks: Task added");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-sheet-tasks"] });
    },
    onError: (error) => {
      console.error("useSyncTasks: Mutation failed:", error);
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: number) => {
      if (!isGisInitialized) {
        await initializeGisClient();
      }
      if (!isSignedIn()) {
        console.log("User not signed in, prompting sign-in");
        await signIn();
      }
      console.log("useDeleteTask: Deleting taskId:", taskId);
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Tasks!A2:I",
        access_token: accessToken!,
      });
      const values = response.result.values || [];
      const rowIndex = values.findIndex((row) => parseInt(row[0]) === taskId);
      if (rowIndex === -1) {
        throw new Error(`Task ${taskId} not found`);
      }
      // Shift rows up to delete (Google Sheets API doesn't have a direct delete row method)
      const batchUpdate = {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0, // Assuming Sheet1
                dimension: "ROWS",
                startIndex: rowIndex + 1,
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      };
      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        access_token: accessToken!,
        resource: batchUpdate,
      });
      console.log("useDeleteTask: Task deleted");
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["google-sheet-tasks"] });
      const previousAllTasks = queryClient.getQueryData<Task[]>(["google-sheet-tasks"]);
      queryClient.setQueryData<Task[]>(["google-sheet-tasks"], (old) =>
        old?.filter((task) => task.id !== taskId)
      );
      const previousDateTasks: { [key: string]: Task[] } = {};
      queryClient.getQueriesData<Task[]>({ queryKey: ["google-sheet-tasks"] }).forEach(([queryKey, data]) => {
        if (queryKey[1] && data) {
          previousDateTasks[queryKey[1] as string] = data;
          queryClient.setQueryData<Task[]>(queryKey, (old) =>
            old?.filter((task) => task.id !== taskId)
          );
        }
      });
      console.log("useDeleteTask: Optimistic update applied for taskId:", taskId);
      return { previousAllTasks, previousDateTasks };
    },
    onError: (error, taskId, context) => {
      console.error("useDeleteTask: Mutation failed:", error);
      queryClient.setQueryData(["google-sheet-tasks"], context?.previousAllTasks);
      Object.entries(context?.previousDateTasks || {}).forEach(([date, tasks]) => {
        queryClient.setQueryData(["google-sheet-tasks", date], tasks);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["google-sheet-tasks"] });
    },
  });
};