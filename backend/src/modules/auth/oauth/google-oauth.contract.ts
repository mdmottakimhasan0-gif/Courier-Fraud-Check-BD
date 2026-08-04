export type GoogleOAuthProfile = {
  email: string;
  emailVerified: boolean;
  googleUserId: string;
  name?: string;
};

export interface GoogleOAuthVerifier {
  verifyIdToken(idToken: string): Promise<GoogleOAuthProfile>;
}
