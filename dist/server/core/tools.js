"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSearchTripsTool = createSearchTripsTool;
exports.createGetFareRatesTool = createGetFareRatesTool;
exports.createGetVehicleRatesTool = createGetVehicleRatesTool;
exports.createEscalateToSupportTool = createEscalateToSupportTool;
exports.createCheckBookingStatusTool = createCheckBookingStatusTool;
exports.createGetPortInfoTool = createGetPortInfoTool;
exports.createGetScheduleSummaryTool = createGetScheduleSummaryTool;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
/**
 * Search for available ferry/ship trips between ports
 */
function createSearchTripsTool(context) {
    return new tools_1.DynamicStructuredTool({
        name: "search_trips",
        description: `Search for available ferry/ship trips between ports. Use this when user asks about:
- Trip schedules or availability
- "Show me trips from X to Y"
- "What trips are available tomorrow?"
- "Are there any boats to [destination]?"

IMPORTANT PORT CODE MAPPINGS (use these exact codes):
- Bogo (Bogo City, Cebu) = BOG
- Cordova (Cordova, Cebu) = COR
- Cebu (Cebu City) = CEB
- Manila = MNL
- Tagbilaran (Bohol) = TAG
- Cagayan = PAL
- Dumaguete = DUM
- Siquijor = SIQ
- Iloilo = ILO

CRITICAL: Cordova is NOT Manila! Cordova = COR, Manila = MNL. They are different locations.`,
        schema: zod_1.z.object({
            origin_code: zod_1.z.string().describe("3-letter origin port code - use mappings: BOG=Bogo, COR=Cordova, CEB=Cebu, MNL=Manila, TAG=Tagbilaran, PAL=Cagayan"),
            destination_code: zod_1.z.string().describe("3-letter destination port code - use mappings: BOG=Bogo, COR=Cordova, CEB=Cebu, MNL=Manila, TAG=Tagbilaran, PAL=Cagayan"),
            date: zod_1.z.string().describe("Travel date in YYYY-MM-DD format"),
            tenant_id: zod_1.z.number().optional().describe("Specific shipping line ID, omit for all shipping lines"),
        }),
        func: async ({ origin_code, destination_code, date, tenant_id }) => {
            try {
                if (tenant_id || context.tenantId) {
                    // Single tenant query
                    const targetTenantId = tenant_id || context.tenantId;
                    const tenant = await context.getTenantById(targetTenantId);
                    const response = await context.tenantRequest("GET", `/trips?origin_code=${origin_code}&destination_code=${destination_code}&departure_date=${date}&passenger_count=1&vehicle_count=0&page=1&sort=departureDate`, undefined, tenant);
                    return JSON.stringify({
                        success: true,
                        trips: response.data || [],
                        shipping_line: tenant.name,
                        count: response.data?.length || 0,
                    });
                }
                else {
                    // Aggregator mode: query all tenants
                    const tenants = await context.getAllTenants();
                    const allTrips = [];
                    await Promise.all(tenants.map(async (tenant) => {
                        try {
                            const response = await context.tenantRequest("GET", `/trips?origin_code=${origin_code}&destination_code=${destination_code}&departure_date=${date}&passenger_count=1&vehicle_count=0&page=1&sort=departureDate`, undefined, tenant);
                            if (response.data && Array.isArray(response.data)) {
                                response.data.forEach((trip) => {
                                    allTrips.push({
                                        ...trip,
                                        shipping_line: tenant.name,
                                        tenant_id: tenant.id,
                                    });
                                });
                            }
                        }
                        catch (error) {
                            // Gracefully handle tenant API failures
                            console.error(`Failed to fetch trips from tenant ${tenant.name}:`, error);
                        }
                    }));
                    // Sort by departure time
                    allTrips.sort((a, b) => {
                        const timeA = new Date(a.total_departure_time || a.scheduled_departure).getTime();
                        const timeB = new Date(b.total_departure_time || b.scheduled_departure).getTime();
                        return timeA - timeB;
                    });
                    return JSON.stringify({
                        success: true,
                        trips: allTrips,
                        count: allTrips.length,
                        shipping_lines: [...new Set(allTrips.map(t => t.shipping_line))],
                    });
                }
            }
            catch (error) {
                return JSON.stringify({
                    success: false,
                    error: error.message || "Failed to search trips",
                    trips: [],
                });
            }
        },
    });
}
/**
 * Get fare rates for a specific route
 */
function createGetFareRatesTool(context) {
    return new tools_1.DynamicStructuredTool({
        name: "get_fare_rates",
        description: `Get pricing information for ferry/ship trips. Use this when user asks about:
- Ticket prices or fares
- "How much is a ticket?"
- "What's the price from X to Y?"
- Cost for passengers or vehicles

IMPORTANT PORT CODE MAPPINGS (use these exact codes):
- Bogo (Bogo City, Cebu) = BOG
- Cordova (Cordova, Cebu) = COR
- Cebu (Cebu City) = CEB
- Manila = MNL
- Tagbilaran (Bohol) = TAG
- Cagayan = PAL
- Dumaguete = DUM
- Siquijor = SIQ
- Iloilo = ILO

CRITICAL: Cordova is NOT Manila! Cordova = COR, Manila = MNL. They are different locations.`,
        schema: zod_1.z.object({
            origin_code: zod_1.z.string().describe("3-letter origin port code - BOG=Bogo, COR=Cordova, CEB=Cebu, MNL=Manila, TAG=Tagbilaran, PAL=Cagayan, DUM=Dumaguete, SIQ=Siquijor, ILO=Iloilo"),
            destination_code: zod_1.z.string().describe("3-letter destination port code - BOG=Bogo, COR=Cordova, CEB=Cebu, MNL=Manila, TAG=Tagbilaran, PAL=Cagayan, DUM=Dumaguete, SIQ=Siquijor, ILO=Iloilo"),
            passenger_type: zod_1.z.enum(["adult", "child", "senior", "pwd", "infant"]).optional().describe("Type of passenger"),
            tenant_id: zod_1.z.number().optional().describe("Specific shipping line ID"),
        }),
        func: async ({ origin_code, destination_code, passenger_type, tenant_id }) => {
            try {
                console.log(`[get_fare_rates] tenant_id=${tenant_id}, context.tenantId=${context.tenantId}`);
                if (tenant_id || context.tenantId) {
                    // Single tenant query
                    const targetTenantId = tenant_id || context.tenantId;
                    console.log(`[get_fare_rates] Using single tenant mode with tenantId=${targetTenantId}`);
                    const tenant = await context.getTenantById(targetTenantId);
                    // Build query params - use route_code format
                    const routeCode = `${origin_code}-${destination_code}`;
                    let queryParams = `route_code=${routeCode}`;
                    if (passenger_type) {
                        queryParams += `&passenger_type_code=${passenger_type}`;
                    }
                    // Query centralized API v2 rates endpoint instead of Client API
                    const apiV2Url = process.env.API_V2_URL || 'http://localhost:3002';
                    const url = `${apiV2Url}/rates/passenger?${queryParams}`;
                    console.log(`[get_fare_rates] Querying API v2: ${url}`);
                    const response = await fetch(url);
                    const data = await response.json();
                    console.log(`[get_fare_rates] API Response:`, JSON.stringify(data));
                    console.log(`[get_fare_rates] Rates found: ${data.data?.length || 0}`);
                    const result = {
                        success: data.success || true,
                        rates: data.data || [],
                        origin: origin_code,
                        destination: destination_code,
                    };
                    console.log(`[get_fare_rates] Returning:`, JSON.stringify(result));
                    return result;
                }
            }
            catch (error) {
                return {
                    success: false,
                    error: error.message || "Failed to fetch fare rates",
                    rates: [],
                };
            }
        },
    });
}
/**
 * Get vehicle rates for a specific route
 */
function createGetVehicleRatesTool(context) {
    return new tools_1.DynamicStructuredTool({
        name: "get_vehicle_rates",
        description: `Get vehicle pricing for ferry/ship trips. Use this when user asks about:
- Vehicle or car rates
- "How much to bring a car?"
- "What's the price for a motorcycle?"
- Cost for bringing vehicles

IMPORTANT PORT CODE MAPPINGS (use these exact codes):
- Bogo (Bogo City, Cebu) = BOG
- Cordova (Cordova, Cebu) = COR
- Cebu (Cebu City) = CEB
- Manila = MNL
- Tagbilaran (Bohol) = TAG
- Cagayan = PAL
- Dumaguete = DUM
- Siquijor = SIQ
- Iloilo = ILO

CRITICAL: Cordova is NOT Manila! Cordova = COR, Manila = MNL. They are different locations.`,
        schema: zod_1.z.object({
            origin_code: zod_1.z.string().describe("3-letter origin port code - BOG=Bogo, COR=Cordova, CEB=Cebu, MNL=Manila, TAG=Tagbilaran, PAL=Cagayan, DUM=Dumaguete, SIQ=Siquijor, ILO=Iloilo"),
            destination_code: zod_1.z.string().describe("3-letter destination port code - BOG=Bogo, COR=Cordova, CEB=Cebu, MNL=Manila, TAG=Tagbilaran, PAL=Cagayan, DUM=Dumaguete, SIQ=Siquijor, ILO=Iloilo"),
            vehicle_type: zod_1.z.string().optional().describe("Type of vehicle (e.g., motorcycle, car, truck)"),
            tenant_id: zod_1.z.number().optional().describe("Specific shipping line ID"),
        }),
        func: async ({ origin_code, destination_code, vehicle_type, tenant_id }) => {
            try {
                if (tenant_id || context.tenantId) {
                    const targetTenantId = tenant_id || context.tenantId;
                    const tenant = await context.getTenantById(targetTenantId);
                    const routeCode = `${origin_code}-${destination_code}`;
                    let queryParams = `route_code=${routeCode}`;
                    if (vehicle_type) {
                        queryParams += `&cargo_class_code=${vehicle_type}`;
                    }
                    // Query centralized API v2 rates endpoint
                    const apiV2Url = process.env.API_V2_URL || 'http://localhost:3002';
                    const url = `${apiV2Url}/rates/cargo?${queryParams}`;
                    const response = await fetch(url);
                    const data = await response.json();
                    return {
                        success: data.success || true,
                        rates: data.data || [],
                        origin: origin_code,
                        destination: destination_code,
                    };
                }
                else {
                    const tenants = await context.getAllTenants();
                    const allRates = [];
                    const routeCode = `${origin_code}-${destination_code}`;
                    await Promise.all(tenants.map(async (tenant) => {
                        try {
                            let queryParams = `route_code=${routeCode}`;
                            if (vehicle_type) {
                                queryParams += `&cargo_class_code=${vehicle_type}`;
                            }
                            const response = await context.tenantRequest("GET", `/base-rates/cargo?${queryParams}`, undefined, tenant);
                            if (response.data && Array.isArray(response.data)) {
                                response.data.forEach((rate) => {
                                    allRates.push({
                                        ...rate,
                                        shipping_line: tenant.name,
                                        tenant_id: tenant.id,
                                    });
                                });
                            }
                        }
                        catch (error) {
                            console.error(`Failed to fetch vehicle rates from tenant ${tenant.name}:`, error);
                        }
                    }));
                    return {
                        success: true,
                        rates: allRates,
                        origin: origin_code,
                        destination: destination_code,
                        shipping_lines: [...new Set(allRates.map(r => r.shipping_line))],
                    };
                }
            }
            catch (error) {
                return {
                    success: false,
                    error: error.message || "Failed to fetch vehicle rates",
                    rates: [],
                };
            }
        },
    });
}
/**
 * Escalate a customer inquiry to human support
 */
function createEscalateToSupportTool(context) {
    return new tools_1.DynamicStructuredTool({
        name: "escalate_to_support",
        description: "Escalate a customer inquiry to human support when the AI cannot resolve it. Use this when: the customer explicitly asks to speak to a human, the issue requires account-level access, the query involves complaints/refunds/cancellations, or the AI cannot provide a satisfactory answer after 2 attempts.",
        schema: zod_1.z.object({
            subject: zod_1.z.string().describe("Brief subject of the support request"),
            description: zod_1.z.string().describe("Detailed description of what the customer needs help with"),
            category: zod_1.z.enum(["booking_issue", "refund_request", "complaint", "schedule_change", "account_issue", "payment_issue", "general"]).describe("Category of the support request"),
            priority: zod_1.z.enum(["low", "medium", "high", "urgent"]).describe("Priority based on urgency - urgent for same-day travel issues"),
            customer_name: zod_1.z.string().optional().describe("Customer name if provided"),
            customer_email: zod_1.z.string().optional().describe("Customer email if provided"),
            customer_phone: zod_1.z.string().optional().describe("Customer phone if provided"),
        }),
        func: async (input) => {
            try {
                const tenantId = context.tenantId;
                const apiBase = process.env.API_BASE_URL || "http://localhost:3000";
                const res = await fetch(`${apiBase}/support/tickets`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        tenant_id: tenantId,
                        source: "chatbot",
                        subject: input.subject,
                        description: input.description,
                        category: input.category,
                        priority: input.priority,
                        customer_name: input.customer_name,
                        customer_email: input.customer_email,
                        customer_phone: input.customer_phone,
                    }),
                });
                if (!res.ok)
                    throw new Error(`Support API error: ${res.status}`);
                const data = await res.json();
                return JSON.stringify({
                    success: true,
                    ticket_id: data.data?.id,
                    message: "Support ticket created. A customer service representative will reach out soon.",
                });
            }
            catch (error) {
                return JSON.stringify({
                    success: false,
                    message: "I apologize for the inconvenience. Please contact our support team directly.",
                    error: error.message,
                });
            }
        },
    });
}
/**
 * Check the status of an existing booking
 */
function createCheckBookingStatusTool(context) {
    return new tools_1.DynamicStructuredTool({
        name: "check_booking_status",
        description: "Check the status of an existing booking using its reference number. Customers can ask about their booking status, departure times, or booking details.",
        schema: zod_1.z.object({
            reference_number: zod_1.z.string().describe("The 6-character booking reference number"),
        }),
        func: async (input) => {
            try {
                const tenantId = context.tenantId;
                const apiBase = process.env.API_BASE_URL || "http://localhost:3000";
                const res = await fetch(`${apiBase}/bookings/reference/${input.reference_number}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                if (!res.ok) {
                    return JSON.stringify({
                        success: false,
                        message: `No booking found with reference number ${input.reference_number}. Please double-check the reference number.`,
                    });
                }
                const data = await res.json();
                const booking = data.data;
                return JSON.stringify({
                    success: true,
                    booking: {
                        reference_number: booking.reference_number,
                        status: booking.status,
                        passenger_count: booking.passenger_count,
                        total_price: booking.total_price,
                        created_at: booking.created_at,
                    },
                });
            }
            catch (error) {
                return JSON.stringify({
                    success: false,
                    message: "Unable to look up booking. Please try again or contact support.",
                    error: error.message,
                });
            }
        },
    });
}
/**
 * Get information about a port including routes and destinations
 */
function createGetPortInfoTool(context) {
    return new tools_1.DynamicStructuredTool({
        name: "get_port_info",
        description: "Get information about a port including its location, available routes, and facilities. Use when customers ask about port details, directions, or what destinations are available from a port.",
        schema: zod_1.z.object({
            port_code: zod_1.z.string().optional().describe("3-letter port code (e.g., BOG, COR, CEB)"),
            port_name: zod_1.z.string().optional().describe("Port name to search for (e.g., 'Bogo', 'Cebu')"),
        }),
        func: async (input) => {
            try {
                const apiBase = process.env.API_BASE_URL || "http://localhost:3000";
                const routesRes = await fetch(`${apiBase}/routes`);
                if (!routesRes.ok)
                    throw new Error("Failed to fetch routes");
                const routesData = await routesRes.json();
                const routes = routesData.data || [];
                const searchTerm = (input.port_code || input.port_name || "").toLowerCase();
                const matchingRoutes = routes.filter((r) => r.src_port_code?.toLowerCase().includes(searchTerm) ||
                    r.src_port_name?.toLowerCase().includes(searchTerm) ||
                    r.dest_port_code?.toLowerCase().includes(searchTerm) ||
                    r.dest_port_name?.toLowerCase().includes(searchTerm));
                if (matchingRoutes.length === 0) {
                    return JSON.stringify({
                        success: false,
                        message: `No port found matching "${input.port_code || input.port_name}". Available ports include: ${[...new Set(routes.map((r) => r.src_port_name))].slice(0, 10).join(", ")}`,
                    });
                }
                const origins = [...new Set(matchingRoutes.filter((r) => r.src_port_code?.toLowerCase().includes(searchTerm) ||
                        r.src_port_name?.toLowerCase().includes(searchTerm)).map((r) => `${r.dest_port_name} (${r.dest_port_code})`))];
                const portName = matchingRoutes[0]?.src_port_name || matchingRoutes[0]?.dest_port_name;
                const portCode = matchingRoutes[0]?.src_port_code || matchingRoutes[0]?.dest_port_code;
                return JSON.stringify({
                    success: true,
                    port: {
                        name: portName,
                        code: portCode,
                        destinations: origins,
                        route_count: origins.length,
                    },
                });
            }
            catch (error) {
                return JSON.stringify({ success: false, error: error.message });
            }
        },
    });
}
/**
 * Get a summary of available sailing schedules for a route
 */
function createGetScheduleSummaryTool(context) {
    return new tools_1.DynamicStructuredTool({
        name: "get_schedule_summary",
        description: "Get a summary of available sailing schedules for a route over the coming days. Shows which dates have trips available without needing a specific date. Use when customers want to know 'when are there ferries' or 'what days can I travel'.",
        schema: zod_1.z.object({
            origin_code: zod_1.z.string().describe("3-letter origin port code"),
            destination_code: zod_1.z.string().describe("3-letter destination port code"),
            days_ahead: zod_1.z.number().optional().describe("Number of days to look ahead (default 14)"),
        }),
        func: async (input) => {
            try {
                const apiBase = process.env.API_BASE_URL || "http://localhost:3000";
                const limit = input.days_ahead || 14;
                const res = await fetch(`${apiBase}/trips/available-dates?origin_code=${input.origin_code}&destination_code=${input.destination_code}&limit=${limit}`);
                if (!res.ok)
                    throw new Error("Failed to fetch schedule");
                const data = await res.json();
                return JSON.stringify({
                    success: true,
                    origin: input.origin_code,
                    destination: input.destination_code,
                    available_dates: data.data || [],
                    date_count: (data.data || []).length,
                    message: (data.data || []).length > 0
                        ? `Found ${data.data.length} dates with available sailings`
                        : "No scheduled sailings found for this route in the coming days",
                });
            }
            catch (error) {
                return JSON.stringify({ success: false, error: error.message });
            }
        },
    });
}
//# sourceMappingURL=tools.js.map