import { Injectable } from "@nestjs/common";
import type { DeviceDescriptor } from "../contracts/auth.types";

export type SuspiciousLoginSignal = {
  reasons: string[];
  riskLevel: "low" | "medium" | "high";
  suspicious: boolean;
};

export type KnownDeviceSnapshot = {
  countryCode?: string;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class SuspiciousLoginDetector {
  evaluate(device: DeviceDescriptor, knownDevices: KnownDeviceSnapshot[]): SuspiciousLoginSignal {
    const reasons: string[] = [];
    const knownIp = knownDevices.some((knownDevice) => knownDevice.ipAddress === device.ipAddress);
    const knownUserAgent = knownDevices.some((knownDevice) => knownDevice.userAgent === device.userAgent);

    if (device.ipAddress && !knownIp) {
      reasons.push("new_ip_address");
    }

    if (device.userAgent && !knownUserAgent) {
      reasons.push("new_user_agent");
    }

    return {
      reasons,
      riskLevel: reasons.length >= 2 ? "high" : reasons.length === 1 ? "medium" : "low",
      suspicious: reasons.length > 0
    };
  }
}
