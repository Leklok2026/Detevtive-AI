export function getSessionId(): string | null {
  return localStorage.getItem("detective_session_id");
}

export function getPlayerName(): string | null {
  return localStorage.getItem("detective_player_name");
}

export function setSession(sessionId: string, name: string) {
  localStorage.setItem("detective_session_id", sessionId);
  localStorage.setItem("detective_player_name", name);
}

export function clearSession() {
  localStorage.removeItem("detective_session_id");
  localStorage.removeItem("detective_player_name");
}

export function getAdminKey(): string | null {
  return localStorage.getItem("detective_admin_key");
}

export function setAdminKey(key: string) {
  localStorage.setItem("detective_admin_key", key);
}

export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
