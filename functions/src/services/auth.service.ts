import { OAuth2Client } from "google-auth-library";
import * as admin from "firebase-admin";
import { encryptToken, decryptToken } from "../utils/crypto.util";
import { UserRole } from "../types/enums";
import { AppError } from "../utils/errors";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

function getOAuthClient() {
  return new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function getAuthUrl(role: UserRole, blhsUserId: string): string {
  const oauth2Client = getOAuthClient();
  const scopes =
    role === UserRole.TEACHER
      ? [
          "https://www.googleapis.com/auth/classroom.courses.readonly",
          "https://www.googleapis.com/auth/classroom.courseworkmaterials",
          "https://www.googleapis.com/auth/classroom.coursework.students",
          "https://www.googleapis.com/auth/userinfo.email",
        ]
      : [
          "https://www.googleapis.com/auth/classroom.courses.readonly",
          "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
          "https://www.googleapis.com/auth/userinfo.email",
        ];

  const state = Buffer.from(JSON.stringify({ role, blhsUserId })).toString(
    "base64",
  );

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state,
  });
}

export async function handleCallback(
  code: string,
  stateBase64: string,
): Promise<void> {
  const stateJson = Buffer.from(stateBase64, "base64").toString("utf8");
  const { role, blhsUserId } = JSON.parse(stateJson);

  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const userInfoResponse = await oauth2Client.request({
    url: "https://www.googleapis.com/oauth2/v2/userinfo",
  });
  const userInfo = userInfoResponse.data as any;

  const tokenData = {
    blhs_user_id: blhsUserId,
    google_user_id: userInfo.id,
    email: userInfo.email,
    role: role,
    access_token: encryptToken(tokens.access_token || ""),
    refresh_token: tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : null,
    token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    updated_at: new Date(),
  };

  const docRef = db.collection("oauth_tokens").doc(blhsUserId);
  await docRef.set(tokenData, { merge: true });
}

export async function getValidAccessToken(blhsUserId: string): Promise<string> {
  const docRef = db.collection("oauth_tokens").doc(blhsUserId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new AppError("User not connected to Google Classroom", 401);
  }

  const data = doc.data() as any;
  const accessToken = decryptToken(data.access_token);
  const tokenExpiry = data.token_expiry ? data.token_expiry.toDate() : null;
  const now = new Date();

  // If token is still valid (more than 5 mins before expiry), return it
  if (!tokenExpiry || tokenExpiry.getTime() - now.getTime() >= 5 * 60 * 1000) {
    return accessToken;
  }

  // Need refresh
  if (!data.refresh_token) {
    throw new AppError(
      "Token expired and no refresh token available. User must re-authenticate.",
      401,
    );
  }

  const oauth2Client = getOAuthClient();
  const refreshToken = decryptToken(data.refresh_token);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const res = await oauth2Client.getAccessToken();
    const newAccessToken = res.token;

    await docRef.update({
      access_token: encryptToken(newAccessToken || ""),
      token_expiry: res.res?.data.expiry_date
        ? new Date(res.res.data.expiry_date)
        : null,
      updated_at: new Date(),
    });

    return newAccessToken || "";
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    throw new AppError("Failed to refresh token. User must re-authenticate.", 401);
  }
}

export async function revokeTokens(blhsUserId: string): Promise<void> {
  const docRef = db.collection("oauth_tokens").doc(blhsUserId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return;
  }

  const data = doc.data() as any;
  if (data.refresh_token) {
    const oauth2Client = getOAuthClient();
    const refreshToken = decryptToken(data.refresh_token);
    try {
      await oauth2Client.revokeToken(refreshToken);
    } catch (error) {
      console.error("Error revoking Google token:", error);
    }
  }

  await docRef.delete();
}

export async function checkAuthStatus(blhsUserId: string): Promise<{
  connected: boolean;
  email?: string;
  role?: UserRole;
}> {
  const doc = await db.collection("oauth_tokens").doc(blhsUserId).get();
  if (!doc.exists) {
    return { connected: false };
  }
  const data = doc.data() as any;
  return {
    connected: true,
    email: data.email,
    role: data.role,
  };
}
