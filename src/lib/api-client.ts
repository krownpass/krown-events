// lib/api-client.ts

import { useAuthStore } from "@/stores/auth-store";
import { API_BASE_URL } from "./constants";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestConfig {
    headers?: Record<string, string>;
    responseType?: "json" | "blob" | "text";
    data?: Record<string, unknown>;
}

interface ApiResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    ok: boolean;
}

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public code?: string,
        public response?: any
    ) {
        super(message);
        this.name = "ApiError";
    }
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T = any>(
        method: HttpMethod,
        url: string,
        config: RequestConfig & { body?: BodyInit } = {}
    ): Promise<ApiResponse<T>> {
        const requestUrl = url.startsWith("http")
            ? url
            : `${this.baseUrl}${url}`;


        const accessToken = useAuthStore.getState().accessToken;
        
        // Remove Content-Type if we're sending FormData to allow browser to set it with boundary
        const headers: Record<string, string> = {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...config.headers,
        };
        
        if (!config.body && !(config.data instanceof FormData) && !headers["Content-Type"]) {
             headers["Content-Type"] = "application/json";
        }
        
        // When using FormData, let the browser define the Content-Type to include the boundary
        if (config.data instanceof FormData || config.body instanceof FormData) {
            delete headers["Content-Type"];
        }

        const requestOptions: RequestInit = {
            method,
            headers,
            credentials: "include",
            cache: "no-store",
        };

        if (config.body && method !== "GET") {
             requestOptions.body = config.body;
        } else if (config.data && method !== "GET") {
            if (config.data instanceof FormData) {
                 requestOptions.body = config.data;
            } else {
                 requestOptions.body = JSON.stringify(config.data);
            }
        }

        try {
            const response = await fetch(requestUrl, requestOptions);

            let data: T;
            if (config.responseType === "blob") {
                data = (await response.blob()) as T;
            } else if (config.responseType === "text") {
                data = (await response.text()) as T;
            } else {
                const text = await response.text();
                data = text ? JSON.parse(text) : null;
            }

            if (!response.ok) {
                throw new ApiError(
                    (data as any)?.message || `Request failed with ${response.status}`,
                    response.status,
                    (data as any)?.code,
                    data
                );
            }

            const headers: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });

            return {
                data,
                status: response.status,
                statusText: response.statusText,
                headers,
                ok: response.ok,
            };
        } catch (error) {
            if (error instanceof ApiError) throw error;

            throw new ApiError(
                error instanceof Error ? error.message : "Network error",
                0,
                "NETWORK_ERROR"
            );
        }
    }

    async get<T = any>(url: string, config?: RequestConfig) {
        return this.request<T>("GET", url, config);
    }

    async post<T = any>(url: string, data?: unknown, config?: RequestConfig) {
        return this.request<T>("POST", url, {
            ...config,
            data: data as Record<string, unknown>,
        });
    }

    async put<T = any>(url: string, data?: unknown, config?: RequestConfig) {
        return this.request<T>("PUT", url, {
            ...config,
            data: data as Record<string, unknown>,
        });
    }

    async patch<T = any>(url: string, data?: unknown, config?: RequestConfig) {
        return this.request<T>("PATCH", url, {
            ...config,
            data: data as Record<string, unknown>,
        });
    }

    async delete<T = any>(url: string, config?: RequestConfig) {
        return this.request<T>("DELETE", url, config);
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
