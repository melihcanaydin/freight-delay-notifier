import { z } from "zod";

export interface RouteInput {
  from: string;
  to: string;
}

export const WorkflowInputSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  contact: z.string().min(1),
  delayThreshold: z.number().optional(),
  workflowId: z.string().optional(),
  customerName: z.string().min(1),
});

export type WorkflowInput = z.infer<typeof WorkflowInputSchema>;

export interface NotificationPayload {
  contact: string;
  message: string;
}
