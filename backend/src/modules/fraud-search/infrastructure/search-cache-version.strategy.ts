import { Injectable } from "@nestjs/common";

@Injectable()
export class SearchCacheVersionStrategy {
  currentVersion(): string {
    return "v1";
  }
}
