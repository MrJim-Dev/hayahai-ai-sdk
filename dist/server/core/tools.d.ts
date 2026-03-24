import { DynamicStructuredTool } from "@langchain/core/tools";
/**
 * Tool execution context passed from API v2
 */
export interface ToolContext {
    tenantId?: number;
    scope?: string;
    getTenantById: (id: number) => Promise<any>;
    getAllTenants: () => Promise<any[]>;
    tenantRequest: <T>(method: string, path: string, body: any, tenant: any) => Promise<T>;
}
/**
 * Search for available ferry/ship trips between ports
 */
export declare function createSearchTripsTool(context: ToolContext): any;
/**
 * Get fare rates for a specific route
 */
export declare function createGetFareRatesTool(context: ToolContext): any;
/**
 * Get vehicle rates for a specific route
 */
export declare function createGetVehicleRatesTool(context: ToolContext): any;
/**
 * Escalate a customer inquiry to human support
 */
export declare function createEscalateToSupportTool(context: ToolContext): DynamicStructuredTool;
/**
 * Check the status of an existing booking
 */
export declare function createCheckBookingStatusTool(context: ToolContext): DynamicStructuredTool;
/**
 * Get information about a port including routes and destinations
 */
export declare function createGetPortInfoTool(context: ToolContext): DynamicStructuredTool;
/**
 * Get a summary of available sailing schedules for a route
 */
export declare function createGetScheduleSummaryTool(context: ToolContext): DynamicStructuredTool;
//# sourceMappingURL=tools.d.ts.map