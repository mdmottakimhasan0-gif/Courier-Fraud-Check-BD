import { Injectable } from "@nestjs/common";
import { AuthConfigService } from "../auth-config.service";

export type SecureCookieOptions = {
  domain?: string;
  httpOnly: true;
  maxAge: number;
  path: string;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
};

@Injectable()
export class SecureCookieFactory {
  constructor(private readonly authConfig: AuthConfigService) {}

  refreshTokenCookie(maxAgeSeconds: number): SecureCookieOptions {
    return {
      domain: this.authConfig.cookies.domain,
      httpOnly: true,
      maxAge: maxAgeSeconds * 1000,
      path: "/api/v1/auth",
      sameSite: this.authConfig.cookies.sameSite,
      secure: this.authConfig.cookies.secure
    };
  }
}
