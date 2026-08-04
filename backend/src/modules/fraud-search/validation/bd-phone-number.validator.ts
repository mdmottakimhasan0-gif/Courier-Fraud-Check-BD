import { Injectable } from "@nestjs/common";
import type { NormalizedPhoneNumber } from "../contracts/fraud-search.types";

const bdPhonePattern = /^(\+?88)?(01[3-9]\d{8})$/;

@Injectable()
export class BdPhoneNumberValidator {
  normalize(phoneNumber: string): NormalizedPhoneNumber {
    const compact = phoneNumber.replace(/[\s-]/g, "");
    const match = bdPhonePattern.exec(compact);

    if (!match?.[2]) {
      throw new Error("Phone number must be a valid Bangladeshi mobile number.");
    }

    return {
      local: match[2]
    };
  }
}
