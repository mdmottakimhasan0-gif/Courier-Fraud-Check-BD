export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  correlationId: string;
  timestamp: string;
};

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string;
  apiKey?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("x-correlation-id", crypto.randomUUID());
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }
  if (options.apiKey) {
    headers.set("x-api-key", options.apiKey);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Request failed");
  }
  return payload;
}

export const authApi = {
  register: (body: unknown) => apiRequest("/auth/register", { method: "POST", body }),
  login: (body: unknown) => apiRequest("/auth/login", { method: "POST", body }),
  refresh: (body: unknown) => apiRequest("/auth/refresh", { method: "POST", body }),
  logout: () => apiRequest("/auth/logout", { method: "POST" }),
  logoutAll: () => apiRequest("/auth/logout-all", { method: "POST" }),
  verifyEmail: (body: unknown) => apiRequest("/auth/verify-email", { method: "POST", body }),
  resendVerification: (body: unknown) =>
    apiRequest("/auth/resend-verification", { method: "POST", body }),
  forgotPassword: (body: unknown) => apiRequest("/auth/forgot-password", { method: "POST", body }),
  resetPassword: (body: unknown) => apiRequest("/auth/reset-password", { method: "POST", body }),
  changePassword: (body: unknown) => apiRequest("/auth/change-password", { method: "POST", body }),
  profile: () => apiRequest("/auth/profile"),
  updateProfile: (body: unknown) => apiRequest("/auth/profile", { method: "PATCH", body }),
  sessions: () => apiRequest("/auth/sessions"),
  currentSession: () => apiRequest("/auth/sessions/current")
};

export const fraudApi = {
  search: (phoneNumber: string) =>
    apiRequest("/fraud-search", { method: "POST", body: { phoneNumber } }),
  status: (searchId: string) => apiRequest(`/fraud-search/${searchId}/status`),
  result: (searchId: string) => apiRequest(`/fraud-search/${searchId}/result`),
  history: () => apiRequest("/fraud-search"),
  details: (searchId: string) => apiRequest(`/fraud-search/${searchId}`)
};

export const courierOrdersApi = {
  credentials: () => apiRequest("/courier-orders/credentials"),
  saveCredential: (body: unknown) => apiRequest("/courier-orders/credentials", { method: "POST", body }),
  riskCheck: (phoneNumber: string) => apiRequest("/courier-orders/risk-check", { method: "POST", body: { phoneNumber } }),
  createOrder: (body: unknown) => apiRequest("/courier-orders", { method: "POST", body }),
  list: () => apiRequest("/courier-orders"),
  details: (orderId: string) => apiRequest(`/courier-orders/${orderId}`),
  refreshShipment: (shipmentId: string) => apiRequest(`/courier-orders/shipments/${shipmentId}/refresh`, { method: "POST" }),
  reports: () => apiRequest("/courier-orders/reports/summary"),
  customerHistory: (phoneNumber: string) => apiRequest(`/courier-orders/customers/history?phoneNumber=${encodeURIComponent(phoneNumber)}`)
};

export const billingApi = {
  plans: () => apiRequest("/billing/plans"),
  activeSubscription: () => apiRequest("/billing/subscriptions/active"),
  usage: () => apiRequest("/billing/usage"),
  invoices: () => apiRequest("/billing/invoices"),
  history: () => apiRequest("/billing/history"),
  validateCoupon: (body: unknown) => apiRequest("/billing/coupons/validate", { method: "POST", body })
};

export const adminApi = {
  dashboard: () => apiRequest("/admin/dashboard"),
  list: (resource: string) => apiRequest(`/admin/${resource}`),
  billing: (resource: string) => apiRequest(`/admin/billing/${resource}`)
};
