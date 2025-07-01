export function createWorkflowLogger(workflowId: string, workflowName: string) {
  return {
    info: (...args: unknown[]) => {
      console.log(`[${workflowName}][${workflowId}]`, ...args);
    },
    warn: (...args: unknown[]) => {
      console.warn(`[${workflowName}][${workflowId}]`, ...args);
    },
    error: (...args: unknown[]) => {
      console.error(`[${workflowName}][${workflowId}]`, ...args);
    },
  };
}
