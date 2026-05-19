import { google } from "googleapis";
import { db } from "@/lib/db";
import { googleCalendarTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/api/auth/google-calendar/callback`;
  if (!clientId || !clientSecret) return null;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthorizationUrl(): string | null {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return null;
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(code: string, userId: string): Promise<boolean> {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return false;
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) return false;
  const now = Date.now();
  await db.delete(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));
  await db.insert(googleCalendarTokens).values({
    userId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date ?? (now + 3600000),
    calendarId: "primary",
    createdAt: now,
    updatedAt: now,
  });
  return true;
}

export async function getRefreshedClient(userId: string) {
  const [tokenRow] = await db.select().from(googleCalendarTokens)
    .where(eq(googleCalendarTokens.userId, userId)).limit(1);
  if (!tokenRow) return null;

  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return null;

  oauth2Client.setCredentials({
    access_token: tokenRow.accessToken,
    refresh_token: tokenRow.refreshToken,
    expiry_date: tokenRow.expiresAt,
  });

  // Refresh if expired (or expires in <5 min)
  if (tokenRow.expiresAt < Date.now() + 300000) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    // Update stored token
    await db.update(googleCalendarTokens)
      .set({
        accessToken: credentials.access_token!,
        expiresAt: credentials.expiry_date ?? (Date.now() + 3600000),
        updatedAt: Date.now(),
      })
      .where(eq(googleCalendarTokens.userId, userId));
  }

  return oauth2Client;
}

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  isGoogleEvent: true;
};

export async function getEventsForWeek(userId: string, weekStart: string): Promise<GoogleCalendarEvent[]> {
  const client = await getRefreshedClient(userId);
  if (!client) return [];

  const calendar = google.calendar({ version: "v3", auth: client });
  const startDate = new Date(weekStart);
  const endDate = new Date(weekStart);
  endDate.setDate(endDate.getDate() + 7);

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  return (res.data.items ?? [])
    .filter(e => e.start?.dateTime && e.end?.dateTime) // only timed events
    .map(e => {
      const start = new Date(e.start!.dateTime!);
      const end = new Date(e.end!.dateTime!);
      const pad = (n: number) => String(n).padStart(2, "0");
      return {
        id: e.id!,
        title: e.summary ?? "(Kein Titel)",
        date: `${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())}`,
        startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
        endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
        isGoogleEvent: true as const,
      };
    });
}

export async function createGoogleEvent(
  userId: string,
  block: { title: string; date: string; startTime: string; endTime: string; notes?: string | null }
): Promise<string | null> {
  const client = await getRefreshedClient(userId);
  if (!client) return null;

  const calendar = google.calendar({ version: "v3", auth: client });
  const startISO = `${block.date}T${block.startTime}:00`;
  const endISO = `${block.date}T${block.endTime}:00`;

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: block.title,
      description: block.notes ?? undefined,
      start: { dateTime: startISO },
      end: { dateTime: endISO },
    },
  });

  return res.data.id ?? null;
}

export async function updateGoogleEvent(
  userId: string,
  googleEventId: string,
  block: { title: string; date: string; startTime: string; endTime: string }
): Promise<void> {
  const client = await getRefreshedClient(userId);
  if (!client) return;
  const calendar = google.calendar({ version: "v3", auth: client });
  await calendar.events.update({
    calendarId: "primary",
    eventId: googleEventId,
    requestBody: {
      summary: block.title,
      start: { dateTime: `${block.date}T${block.startTime}:00` },
      end: { dateTime: `${block.date}T${block.endTime}:00` },
    },
  });
}

export async function deleteGoogleEvent(userId: string, googleEventId: string): Promise<void> {
  const client = await getRefreshedClient(userId);
  if (!client) return;
  const calendar = google.calendar({ version: "v3", auth: client });
  await calendar.events.delete({ calendarId: "primary", eventId: googleEventId });
}

export async function disconnectGoogleCalendar(userId: string): Promise<void> {
  await db.delete(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));
}

export async function isConnected(userId: string): Promise<boolean> {
  const [row] = await db.select({ id: googleCalendarTokens.id })
    .from(googleCalendarTokens)
    .where(eq(googleCalendarTokens.userId, userId))
    .limit(1);
  return !!row;
}
