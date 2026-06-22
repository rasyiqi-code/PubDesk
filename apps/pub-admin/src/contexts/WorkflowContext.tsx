import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Task, TaskHistory, TaskBlocker, TaskApproval } from '../types/workflow.types';

interface WorkflowContextType {
  tasks: Task[];
  taskHistories: TaskHistory[];
  taskBlockers: TaskBlocker[];
  taskApprovals: TaskApproval[];
  isLoading: boolean;
  selectedTaskId: number | null;
  setSelectedTaskId: (id: number | null) => void;
  loadTasks: () => Promise<void>;
  loadTaskHistories: (taskId?: number) => Promise<void>;
  loadTaskBlockers: (taskId?: number) => Promise<void>;
  loadTaskApprovals: (taskId?: number) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  updateTaskStatus: (taskId: number, newStatus: string, notes?: string, proofPathOrLink?: string) => Promise<void>;
  addTaskBlocker: (blocker: Omit<TaskBlocker, 'id' | 'created_at' | 'resolved_at'>) => Promise<number>;
  resolveTaskBlocker: (id: number) => Promise<void>;
  requestApproval: (approval: Omit<TaskApproval, 'id' | 'requested_at' | 'decided_at' | 'decided_by'>) => Promise<number>;
  decideApproval: (id: number, status: string, notes?: string, decidedBy?: string) => Promise<void>;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider: React.FC<{ children: ReactNode; isDbInitialized: boolean }> = ({ children, isDbInitialized }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskHistories, setTaskHistories] = useState<TaskHistory[]>([]);
  const [taskBlockers, setTaskBlockers] = useState<TaskBlocker[]>([]);
  const [taskApprovals, setTaskApprovals] = useState<TaskApproval[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await invoke<Task[]>('get_tasks');
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTaskHistories = async (taskId?: number) => {
    try {
      if (taskId) {
        const data = await invoke<TaskHistory[]>('get_task_history', { taskId });
        setTaskHistories(data || []);
      } else {
        const data = await invoke<TaskHistory[]>('get_all_task_history');
        setTaskHistories(data || []);
      }
    } catch (err) {
      console.error('Failed to load task histories:', err);
    }
  };

  const loadTaskBlockers = async (taskId?: number) => {
    try {
      const data = await invoke<TaskBlocker[]>('get_task_blockers', { taskId });
      setTaskBlockers(data || []);
    } catch (err) {
      console.error('Failed to load task blockers:', err);
    }
  };

  const loadTaskApprovals = async (taskId?: number) => {
    try {
      const data = await invoke<TaskApproval[]>('get_task_approvals', { taskId });
      setTaskApprovals(data || []);
    } catch (err) {
      console.error('Failed to load task approvals:', err);
    }
  };

  const addTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const id = await invoke<number>('add_task', { task });
      await loadTasks();
      return id;
    } catch (err) {
      console.error('Failed to add task:', err);
      throw err;
    }
  };

  const updateTask = async (task: Task) => {
    try {
      await invoke('update_task', { task });
      await loadTasks();
    } catch (err) {
      console.error('Failed to update task:', err);
      throw err;
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await invoke('delete_task', { id });
      await loadTasks();
      if (selectedTaskId === id) {
        setSelectedTaskId(null);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
      throw err;
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: string, notes?: string, proofPathOrLink?: string) => {
    try {
      await invoke('update_task_status', { taskId, newStatus, notes, proofPathOrLink });
      await loadTasks();
      await loadTaskHistories(taskId);
    } catch (err) {
      console.error('Failed to update task status:', err);
      throw err;
    }
  };

  const addTaskBlocker = async (blocker: Omit<TaskBlocker, 'id' | 'created_at' | 'resolved_at'>) => {
    try {
      const id = await invoke<number>('add_task_blocker', { blocker });
      await loadTaskBlockers(blocker.task_id);
      return id;
    } catch (err) {
      console.error('Failed to add task blocker:', err);
      throw err;
    }
  };

  const resolveTaskBlocker = async (id: number) => {
    try {
      await invoke('resolve_task_blocker', { id });
      await loadTaskBlockers();
    } catch (err) {
      console.error('Failed to resolve task blocker:', err);
      throw err;
    }
  };

  const requestApproval = async (approval: Omit<TaskApproval, 'id' | 'requested_at' | 'decided_at' | 'decided_by'>) => {
    try {
      const id = await invoke<number>('request_approval', { approval });
      await loadTaskApprovals(approval.task_id);
      await loadTasks();
      return id;
    } catch (err) {
      console.error('Failed to request approval:', err);
      throw err;
    }
  };

  const decideApproval = async (id: number, status: string, notes?: string, decidedBy?: string) => {
    try {
      await invoke('decide_approval', { id, status, notes, decidedBy });
      await loadTaskApprovals();
      await loadTasks();
    } catch (err) {
      console.error('Failed to decide approval:', err);
      throw err;
    }
  };

  // Muat tasks hanya setelah DB benar-benar siap untuk menghindari
  // pemanggilan invoke sebelum database terinisialisasi.
  useEffect(() => {
    if (isDbInitialized) {
      loadTasks();
    }
  }, [isDbInitialized]);

  return (
    <WorkflowContext.Provider value={{
      tasks,
      taskHistories,
      taskBlockers,
      taskApprovals,
      isLoading,
      selectedTaskId,
      setSelectedTaskId,
      loadTasks,
      loadTaskHistories,
      loadTaskBlockers,
      loadTaskApprovals,
      addTask,
      updateTask,
      deleteTask,
      updateTaskStatus,
      addTaskBlocker,
      resolveTaskBlocker,
      requestApproval,
      decideApproval
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflowContext = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflowContext must be used within WorkflowProvider');
  }
  return context;
};
