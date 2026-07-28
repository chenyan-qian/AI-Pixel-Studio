import request from "@/lib/request";

export type ThemePreference = "dark" | "light" | "system";
export type BackgroundMode = "checkerboard" | "transparent" | "solid";
export type WorkVisibility = "private" | "public" | "review";
export type ProfileVisibility = "public" | "followers" | "private";

export interface NotificationSetting {
  comment: boolean;
  like: boolean;
  review: boolean;
  workEdit: boolean;
}

/**
 * Matches the planned `user_settings` backend record. Extra UI preferences
 * remain client-side until the server endpoint is enabled.
 */
export interface UserSettings {
  id: string;
  userId: string;
  theme: ThemePreference;
  defaultPixelSize: number;
  defaultBackgroundMode: BackgroundMode;
  showGrid: boolean;
  showCoordinates: boolean;
  showColorInfo: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  defaultWorkVisibility: WorkVisibility;
  allowEdit: boolean;
  allowComment: boolean;
  allowLike: boolean;
  notificationSetting: NotificationSetting;
  profileVisibility: ProfileVisibility;
  worksVisibility: ProfileVisibility;
  showOnlineStatus: boolean;
}

export const USER_SETTINGS_ENDPOINT = "/api/user/settings";
const STORAGE_PREFIX = "pixelverse-user-settings";

export function createDefaultSettings(userId: string): UserSettings {
  return {
    id: `local-${userId}`,
    userId,
    theme: "dark",
    defaultPixelSize: 16,
    defaultBackgroundMode: "checkerboard",
    showGrid: true,
    showCoordinates: false,
    showColorInfo: true,
    autoSave: true,
    autoSaveInterval: 30,
    defaultWorkVisibility: "review",
    allowEdit: false,
    allowComment: true,
    allowLike: true,
    notificationSetting: {
      comment: true,
      like: true,
      review: true,
      workEdit: true,
    },
    profileVisibility: "public",
    worksVisibility: "public",
    showOnlineStatus: true,
  };
}

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "dark" || value === "light" || value === "system";
}

export function readUserSettings(userId: string): UserSettings {
  const defaults = createDefaultSettings(userId);
  if (typeof window === "undefined") return defaults;

  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey(userId)) || "{}") as Partial<UserSettings>;
    return {
      ...defaults,
      ...saved,
      userId,
      theme: isThemePreference(saved.theme) ? saved.theme : defaults.theme,
      notificationSetting: { ...defaults.notificationSetting, ...saved.notificationSetting },
    };
  } catch {
    return defaults;
  }
}

export function saveUserSettings(settings: UserSettings) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey(settings.userId), JSON.stringify(settings));
  }
}

/**
 * Future server integration: enable once `GET/PUT /api/user/settings` is
 * available. Local persistence remains the source of truth for this phase.
 */
export const userSettingsApi = {
  async fetch(): Promise<UserSettings> {
    const response = await request.get(USER_SETTINGS_ENDPOINT);
    return response.data as UserSettings;
  },
  async save(settings: UserSettings): Promise<void> {
    await request.put(USER_SETTINGS_ENDPOINT, settings);
  },
};
