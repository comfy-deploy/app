import { create } from "zustand";

interface UploadState {
  isUploading: boolean;
  progress: number | null;
  setProgress: (progress: number | null) => void;
  fileInput: HTMLInputElement | null;
  setFileInput: (input: HTMLInputElement | null) => void;
  fileQueue: File[];
  addToQueue: (files: File[]) => void;
  removeFromQueue: () => File | undefined;
  clearQueue: () => void;
  currentFile: File | null;
  setCurrentFile: (file: File | null) => void;
  failedFiles: string[];
  addFailedFile: (fileName: string) => void;
  clearFailedFiles: () => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  isUploading: false,
  progress: null,
  setProgress: (progress) => set({ progress, isUploading: progress !== null }),
  fileInput: null,
  setFileInput: (input) => set({ fileInput: input }),
  fileQueue: [],
  addToQueue: (files) =>
    set((state) => ({ fileQueue: [...state.fileQueue, ...files] })),
  removeFromQueue: () => {
    const state = get();
    const [nextFile, ...remainingFiles] = state.fileQueue;
    set({ fileQueue: remainingFiles });
    return nextFile;
  },
  clearQueue: () => set({ fileQueue: [] }),
  currentFile: null,
  setCurrentFile: (file) => set({ currentFile: file }),
  failedFiles: [],
  addFailedFile: (fileName) =>
    set((state) => ({
      failedFiles: [...state.failedFiles, fileName],
    })),
  clearFailedFiles: () => set({ failedFiles: [] }),
}));
