import { BadGatewayException, BadRequestException, Inject, Injectable } from "@nestjs/common";
import { CourierProvider, CourierShipmentStatus } from "@prisma/client";
import type { ProviderHttpClient } from "../../courier-providers/contracts/http-client.interface";
import { PROVIDER_HTTP_CLIENT } from "../../courier-providers/provider.tokens";
import type {
  CourierCreateShipmentResult,
  CourierCredentials,
  CourierShipmentStatusResult,
  UnifiedCourierOrderInput
} from "../contracts/courier-order.types";
import { CourierStatusNormalizer } from "../status/courier-status.normalizer";

@Injectable()
export class CourierOrderProviderGateway {
  constructor(
    @Inject(PROVIDER_HTTP_CLIENT) private readonly httpClient: ProviderHttpClient,
    private readonly statusNormalizer: CourierStatusNormalizer
  ) {}

  async createShipment(input: UnifiedCourierOrderInput, credentials: CourierCredentials): Promise<CourierCreateShipmentResult> {
    if (input.provider === CourierProvider.STEADFAST) {
      return this.createSteadfastOrder(input, credentials);
    }
    if (input.provider === CourierProvider.PATHAO) {
      return this.createPathaoOrder(input, credentials);
    }
    if (input.provider === CourierProvider.REDX) {
      return this.createRedxParcel(input, credentials);
    }

    throw new BadRequestException("Unsupported courier provider.");
  }

  async refreshShipmentStatus(
    provider: CourierProvider,
    credentials: CourierCredentials,
    identifiers: { consignmentId?: string | null; merchantInvoiceId?: string | null; trackingId?: string | null }
  ): Promise<CourierShipmentStatusResult> {
    if (provider === CourierProvider.STEADFAST) {
      return this.getSteadfastStatus(credentials, identifiers);
    }
    if (provider === CourierProvider.PATHAO) {
      return this.getPathaoStatus(credentials, identifiers);
    }
    if (provider === CourierProvider.REDX) {
      return this.getRedxStatus(credentials, identifiers);
    }

    throw new BadRequestException("Unsupported courier provider.");
  }

  private async createSteadfastOrder(input: UnifiedCourierOrderInput, credentials: CourierCredentials): Promise<CourierCreateShipmentResult> {
    const baseUrl = this.baseUrl(credentials, "https://portal.packzy.com/api/v1");
    const response = await this.httpClient.send<Record<string, unknown>>({
      body: {
        cod_amount: input.amountToCollect,
        delivery_type: this.numberOption(input.providerOptions, "deliveryType", 0),
        invoice: input.invoiceNumber,
        item_description: input.itemDescription,
        note: input.deliveryInstruction,
        recipient_address: input.customerAddress,
        recipient_name: input.customerName,
        recipient_phone: input.customerPhone,
        total_lot: input.itemQuantity
      },
      headers: {
        "Api-Key": this.requiredString(credentials, "apiKey"),
        "Content-Type": "application/json",
        "Secret-Key": this.requiredString(credentials, "secretKey")
      },
      method: "POST",
      timeoutMs: 8000,
      url: `${baseUrl}/create_order`
    });
    this.ensureSuccess(response.statusCode, response.body);
    const consignment = this.objectValue(response.body, "consignment");
    const rawStatus = this.stringValue(consignment, "status") ?? this.stringValue(response.body, "delivery_status");

    return {
      consignmentId: this.stringValue(consignment, "consignment_id"),
      rawResponse: response.body,
      rawStatus,
      status: this.statusNormalizer.normalize(rawStatus),
      trackingId: this.stringValue(consignment, "tracking_code")
    };
  }

  private async createPathaoOrder(input: UnifiedCourierOrderInput, credentials: CourierCredentials): Promise<CourierCreateShipmentResult> {
    const baseUrl = this.baseUrl(credentials, "https://api-hermes.pathao.com");
    const token = await this.issuePathaoToken(credentials);
    const response = await this.httpClient.send<Record<string, unknown>>({
      body: {
        amount_to_collect: input.amountToCollect,
        delivery_type: this.numberOption(input.providerOptions, "deliveryType", 48),
        item_description: input.itemDescription,
        item_quantity: input.itemQuantity,
        item_type: this.numberOption(input.providerOptions, "itemType", 2),
        item_weight: input.itemWeightKg,
        merchant_order_id: input.merchantOrderId,
        recipient_address: input.customerAddress,
        recipient_name: input.customerName,
        recipient_phone: input.customerPhone,
        special_instruction: input.deliveryInstruction,
        store_id: this.numberCredential(credentials, "storeId")
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      method: "POST",
      timeoutMs: 10000,
      url: `${baseUrl}/aladdin/api/v1/orders`
    });
    this.ensureSuccess(response.statusCode, response.body);
    const data = this.objectValue(response.body, "data");
    const rawStatus = this.stringValue(data, "order_status");

    return {
      consignmentId: this.stringValue(data, "consignment_id"),
      deliveryFee: this.numberValue(data, "delivery_fee"),
      providerOrderId: this.stringValue(data, "merchant_order_id"),
      rawResponse: response.body,
      rawStatus,
      status: this.statusNormalizer.normalize(rawStatus),
      trackingId: this.stringValue(data, "consignment_id")
    };
  }

  private async createRedxParcel(input: UnifiedCourierOrderInput, credentials: CourierCredentials): Promise<CourierCreateShipmentResult> {
    const baseUrl = this.baseUrl(credentials, "https://openapi.redx.com.bd/v1.0.0-beta");
    const response = await this.httpClient.send<Record<string, unknown>>({
      body: {
        cash_collection_amount: input.amountToCollect,
        customer_address: input.customerAddress,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        delivery_area: this.stringOption(input.providerOptions, "deliveryArea"),
        delivery_area_id: this.numberOption(input.providerOptions, "deliveryAreaId"),
        instruction: input.deliveryInstruction,
        is_closed_box: this.booleanOption(input.providerOptions, "isClosedBox", true),
        merchant_invoice_id: input.invoiceNumber,
        parcel_details_json: input.itemDescription
          ? [{ category: "general", name: input.itemDescription, value: this.numberOption(input.providerOptions, "value", input.amountToCollect) }]
          : undefined,
        parcel_weight: Math.round(input.itemWeightKg * 1000),
        pickup_store_id: this.numberOption(input.providerOptions, "pickupStoreId") ?? this.numberCredential(credentials, "pickupStoreId", false),
        value: this.numberOption(input.providerOptions, "value", input.amountToCollect)
      },
      headers: {
        "API-ACCESS-TOKEN": `Bearer ${this.requiredString(credentials, "accessToken")}`,
        "Content-Type": "application/json"
      },
      method: "POST",
      timeoutMs: 10000,
      url: `${baseUrl}/parcel`
    });
    this.ensureSuccess(response.statusCode, response.body);
    const trackingId = this.stringValue(response.body, "tracking_id");

    return {
      rawResponse: response.body,
      rawStatus: "pickup-pending",
      status: CourierShipmentStatus.PICKUP_PENDING,
      trackingId
    };
  }

  private async getSteadfastStatus(
    credentials: CourierCredentials,
    identifiers: { consignmentId?: string | null; merchantInvoiceId?: string | null; trackingId?: string | null }
  ): Promise<CourierShipmentStatusResult> {
    const baseUrl = this.baseUrl(credentials, "https://portal.packzy.com/api/v1");
    const path = identifiers.consignmentId
      ? `/status_by_cid/${identifiers.consignmentId}`
      : identifiers.trackingId
        ? `/status_by_trackingcode/${identifiers.trackingId}`
        : `/status_by_invoice/${identifiers.merchantInvoiceId ?? ""}`;
    const response = await this.httpClient.send<Record<string, unknown>>({
      headers: {
        "Api-Key": this.requiredString(credentials, "apiKey"),
        "Content-Type": "application/json",
        "Secret-Key": this.requiredString(credentials, "secretKey")
      },
      method: "GET",
      timeoutMs: 8000,
      url: `${baseUrl}${path}`
    });
    this.ensureSuccess(response.statusCode, response.body);
    const rawStatus = this.stringValue(response.body, "delivery_status");
    const status = this.statusNormalizer.normalize(rawStatus);

    return { events: [this.event(status, rawStatus, response.body)], rawResponse: response.body, rawStatus, status };
  }

  private async getPathaoStatus(
    credentials: CourierCredentials,
    identifiers: { consignmentId?: string | null; merchantInvoiceId?: string | null; trackingId?: string | null }
  ): Promise<CourierShipmentStatusResult> {
    const consignmentId = identifiers.consignmentId ?? identifiers.trackingId;
    if (!consignmentId) {
      throw new BadRequestException("Pathao status refresh requires consignment ID.");
    }
    const baseUrl = this.baseUrl(credentials, "https://api-hermes.pathao.com");
    const token = await this.issuePathaoToken(credentials);
    const response = await this.httpClient.send<Record<string, unknown>>({
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      method: "GET",
      timeoutMs: 8000,
      url: `${baseUrl}/aladdin/api/v1/orders/${consignmentId}/info`
    });
    this.ensureSuccess(response.statusCode, response.body);
    const data = this.objectValue(response.body, "data");
    const rawStatus = this.stringValue(data, "order_status_slug") ?? this.stringValue(data, "order_status");
    const status = this.statusNormalizer.normalize(rawStatus);

    return { events: [this.event(status, rawStatus, response.body)], rawResponse: response.body, rawStatus, status };
  }

  private async getRedxStatus(
    credentials: CourierCredentials,
    identifiers: { consignmentId?: string | null; merchantInvoiceId?: string | null; trackingId?: string | null }
  ): Promise<CourierShipmentStatusResult> {
    const trackingId = identifiers.trackingId ?? identifiers.consignmentId;
    if (!trackingId) {
      throw new BadRequestException("RedX status refresh requires tracking ID.");
    }
    const baseUrl = this.baseUrl(credentials, "https://openapi.redx.com.bd/v1.0.0-beta");
    const response = await this.httpClient.send<Record<string, unknown>>({
      headers: {
        "API-ACCESS-TOKEN": `Bearer ${this.requiredString(credentials, "accessToken")}`
      },
      method: "GET",
      timeoutMs: 8000,
      url: `${baseUrl}/parcel/info/${trackingId}`
    });
    this.ensureSuccess(response.statusCode, response.body);
    const parcel = this.objectValue(response.body, "parcel");
    const rawStatus = this.stringValue(parcel, "status");
    const status = this.statusNormalizer.normalize(rawStatus);

    return { events: [this.event(status, rawStatus, response.body)], rawResponse: response.body, rawStatus, status };
  }

  private async issuePathaoToken(credentials: CourierCredentials): Promise<string> {
    const baseUrl = this.baseUrl(credentials, "https://api-hermes.pathao.com");
    const response = await this.httpClient.send<Record<string, unknown>>({
      body: {
        client_id: this.requiredString(credentials, "clientId"),
        client_secret: this.requiredString(credentials, "clientSecret"),
        grant_type: "password",
        password: this.requiredString(credentials, "password"),
        username: this.requiredString(credentials, "username")
      },
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      timeoutMs: 8000,
      url: `${baseUrl}/aladdin/api/v1/issue-token`
    });
    this.ensureSuccess(response.statusCode, response.body);
    return this.requiredString(response.body, "access_token");
  }

  private baseUrl(credentials: CourierCredentials, fallback: string): string {
    return String(credentials.baseUrl ?? fallback).replace(/\/$/, "");
  }

  private ensureSuccess(statusCode: number, body: unknown): void {
    if (statusCode < 200 || statusCode >= 300) {
      throw new BadGatewayException({ message: "Courier provider request failed.", providerStatusCode: statusCode, providerResponse: body });
    }
  }

  private event(status: CourierShipmentStatus, rawStatus: string | undefined, rawPayload: unknown) {
    return {
      occurredAt: new Date(),
      rawPayload,
      rawStatus,
      status
    };
  }

  private requiredString(source: Record<string, unknown>, key: string): string {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
    throw new BadRequestException(`Missing courier credential: ${key}.`);
  }

  private numberCredential(source: Record<string, unknown>, key: string, required = true): number | undefined {
    const value = source[key];
    const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : undefined;
    if (Number.isFinite(parsed)) {
      return parsed;
    }
    if (required) {
      throw new BadRequestException(`Missing courier credential: ${key}.`);
    }
    return undefined;
  }

  private objectValue(source: unknown, key: string): Record<string, unknown> {
    if (source && typeof source === "object" && key in source) {
      const value = (source as Record<string, unknown>)[key];
      return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    }
    return {};
  }

  private stringValue(source: unknown, key: string): string | undefined {
    if (source && typeof source === "object") {
      const value = (source as Record<string, unknown>)[key];
      return value === undefined || value === null ? undefined : String(value);
    }
    return undefined;
  }

  private numberValue(source: unknown, key: string): number | undefined {
    if (source && typeof source === "object") {
      const value = (source as Record<string, unknown>)[key];
      const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : undefined;
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private stringOption(source: Record<string, unknown> | undefined, key: string): string | undefined {
    const value = source?.[key];
    return typeof value === "string" && value.trim() ? value : undefined;
  }

  private numberOption(source: Record<string, unknown> | undefined, key: string, fallback?: number): number | undefined {
    const value = source?.[key];
    const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : undefined;
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private booleanOption(source: Record<string, unknown> | undefined, key: string, fallback: boolean): boolean {
    const value = source?.[key];
    return typeof value === "boolean" ? value : fallback;
  }
}
