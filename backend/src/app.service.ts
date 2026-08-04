import { Injectable } from "@nestjs/common";
import { PRODUCT_NAME } from "@cfcb/shared";

@Injectable()
export class AppService {
  getFoundationStatus(): { name: string; milestone: string; status: "ready" } {
    return {
      name: PRODUCT_NAME,
      milestone: "Milestone 1 - Project Foundation",
      status: "ready"
    };
  }
}
