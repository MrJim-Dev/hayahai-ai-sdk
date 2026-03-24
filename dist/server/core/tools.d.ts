import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
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
export declare function createSearchTripsTool(context: ToolContext): DynamicStructuredTool<z.ZodObject<{
    origin_code: z.ZodString;
    destination_code: z.ZodString;
    date: z.ZodString;
    tenant_id: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, {
    origin_code: string;
    destination_code: string;
    date: string;
    tenant_id?: number | undefined;
}, {
    origin_code: string;
    destination_code: string;
    date: string;
    tenant_id?: number | undefined;
}, string, unknown, "search_trips">;
/**
 * Get fare rates for a specific route
 */
export declare function createGetFareRatesTool(context: ToolContext): DynamicStructuredTool<z.ZodObject<{
    origin_code: z.ZodString;
    destination_code: z.ZodString;
    passenger_type: z.ZodOptional<z.ZodEnum<{
        adult: "adult";
        child: "child";
        senior: "senior";
        pwd: "pwd";
        infant: "infant";
    }>>;
    tenant_id: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, {
    origin_code: string;
    destination_code: string;
    passenger_type?: "adult" | "child" | "senior" | "pwd" | "infant" | undefined;
    tenant_id?: number | undefined;
}, {
    origin_code: string;
    destination_code: string;
    passenger_type?: "adult" | "child" | "senior" | "pwd" | "infant" | undefined;
    tenant_id?: number | undefined;
}, {
    success: any;
    rates: any;
    origin: string;
    destination: string;
} | {
    success: boolean;
    error: any;
    rates: never[];
} | undefined, unknown, "get_fare_rates">;
/**
 * Get vehicle rates for a specific route
 */
export declare function createGetVehicleRatesTool(context: ToolContext): DynamicStructuredTool<z.ZodObject<{
    origin_code: z.ZodString;
    destination_code: z.ZodString;
    vehicle_type: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, {
    origin_code: string;
    destination_code: string;
    vehicle_type?: string | undefined;
    tenant_id?: number | undefined;
}, {
    origin_code: string;
    destination_code: string;
    vehicle_type?: string | undefined;
    tenant_id?: number | undefined;
}, {
    success: any;
    rates: any;
    origin: string;
    destination: string;
    shipping_lines?: undefined;
    error?: undefined;
} | {
    success: boolean;
    rates: any[];
    origin: string;
    destination: string;
    shipping_lines: any[];
    error?: undefined;
} | {
    success: boolean;
    error: any;
    rates: never[];
    origin?: undefined;
    destination?: undefined;
    shipping_lines?: undefined;
}, unknown, "get_vehicle_rates">;
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