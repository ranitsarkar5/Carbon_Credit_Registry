import { create } from 'zustand';

interface Project {
  id: string;
  owner: string;
  verified_data: number;
  minted_credits: number;
}

interface Transaction {
  hash: string;
  type: 'Register' | 'Verify' | 'Mint' | 'Retire' | 'Transfer';
  status: 'Pending' | 'Confirmed' | 'Failed';
  timestamp: number;
  explorerLink: string;
  details?: string;
}

interface AppState {
  projects: Project[];
  transactions: Transaction[];
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addTransaction: (tx: Transaction) => void;
  updateTransactionStatus: (hash: string, status: Transaction['status']) => void;
}

export const useAppStore = create<AppState>((set) => ({
  projects: [
    { id: 'proj_demo', owner: 'GBL...ABCD', verified_data: 5000, minted_credits: 3000 }
  ],
  transactions: [],
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  addTransaction: (tx) =>
    set((state) => ({ transactions: [tx, ...state.transactions] })),
  updateTransactionStatus: (hash, status) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.hash === hash ? { ...t, status } : t
      ),
    })),
}));
