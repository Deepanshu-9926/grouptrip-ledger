import { mockCoreOperation } from "../api/mockCoreApi.js";

export async function executeTool(
  action: string,
  args: Record<string, unknown>
) {
  return await mockCoreOperation(action, args);
}