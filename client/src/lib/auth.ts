export async function loginUser(username: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function registerUser(data: {
  username: string;
  password: string;
  role: string;
  teacherId?: string | null;
  studentId?: string | null;
}) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Registration failed");
  return json;
}

export async function logoutUser() {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Logout failed");
  return data;
}

export async function getMe() {
  const res = await fetch("/api/auth/me", {
    credentials: "include",
  });
  if (res.status === 401) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to get user");
  return data;
}
