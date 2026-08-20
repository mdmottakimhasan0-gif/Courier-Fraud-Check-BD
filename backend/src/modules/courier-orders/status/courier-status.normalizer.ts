import { Injectable } from "@nestjs/common";
import { CourierShipmentStatus } from "@prisma/client";

@Injectable()
export class CourierStatusNormalizer {
  normalize(rawStatus?: string): CourierShipmentStatus {
    const status = (rawStatus ?? "").trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
    if (!status) {
      return CourierShipmentStatus.UNKNOWN;
    }

    if (["delivered", "paid"].includes(status)) {
      return CourierShipmentStatus.DELIVERED;
    }
    if (["partial_delivered", "partial_delivery", "partial_return", "partial_delivered_approval_pending"].includes(status)) {
      return CourierShipmentStatus.PARTIAL_DELIVERED;
    }
    if (["cancelled", "canceled", "cancelled_approval_pending"].includes(status)) {
      return CourierShipmentStatus.CANCELLED;
    }
    if (["returned", "agent_returning", "return_in_progress"].includes(status)) {
      return CourierShipmentStatus.RETURNED;
    }
    if (["hold", "agent_hold"].includes(status)) {
      return CourierShipmentStatus.HOLD;
    }
    if (["in_review", "ready_for_delivery", "pending"].includes(status)) {
      return status === "in_review" ? CourierShipmentStatus.IN_REVIEW : CourierShipmentStatus.PENDING;
    }
    if (["pickup_pending", "pickup_pending", "pickup-pending"].includes(status)) {
      return CourierShipmentStatus.PICKUP_PENDING;
    }
    if (["delivery_in_progress", "in_transit", "picked_up", "package_is_picked_up"].includes(status)) {
      return CourierShipmentStatus.IN_TRANSIT;
    }
    if (["failed", "error", "unknown"].includes(status)) {
      return status === "failed" || status === "error" ? CourierShipmentStatus.FAILED : CourierShipmentStatus.UNKNOWN;
    }

    return CourierShipmentStatus.UNKNOWN;
  }
}
