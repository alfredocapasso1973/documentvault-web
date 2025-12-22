import { useMemo, useState } from "react";

type User = { id: string; email: string; createdAt: string };

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

async function api<T>(
    path: string,
    opts: RequestInit & { json?: unknown } = {}
): Promise<{ status: number; data: T | null }> {
    const headers = new Headers(opts.headers);
    if (opts.json !== undefined) headers.set("Content-Type", "application/json");

    const res = await fetch(`${API_BASE}${path}`, {
        ...opts,
        headers,
        credentials: "include",
        body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body,
    });

    let data: T | null = null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) data = (await res.json()) as T;

    return { status: res.status, data };
}

export default function App() {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("a@test.com");
    const [password, setPassword] = useState("Passw0rd!");
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [msg, setMsg] = useState<string>("");

    const canSubmit = useMemo(() => email.length > 0 && password.length > 0, [email, password]);

    async function register() {
        setMsg("");
        const res = await api<{ user: User; accessToken: string }>("/auth/register", {
            method: "POST",
            json: { email, password },
        });

        if (res.status === 201 && res.data) {
            setUser(res.data.user);
            setAccessToken(res.data.accessToken);
            setMsg("Registered");
            return;
        }

        if (res.status === 409) setMsg("Email already exists");
        else if (res.status === 400) setMsg("Invalid payload");
        else setMsg(`Error: ${res.status}`);
    }

    async function login() {
        setMsg("");
        const res = await api<{ user: User; accessToken: string }>("/auth/login", {
            method: "POST",
            json: { email, password },
        });

        if (res.status === 200 && res.data) {
            setUser(res.data.user);
            setAccessToken(res.data.accessToken);
            setMsg("Logged in");
            return;
        }

        if (res.status === 401) setMsg("Invalid credentials");
        else if (res.status === 400) setMsg("Invalid payload");
        else setMsg(`Error: ${res.status}`);
    }

    async function refresh() {
        setMsg("");
        const res = await api<{ user: User; accessToken: string }>("/auth/refresh", { method: "POST" });

        if (res.status === 200 && res.data) {
            setUser(res.data.user);
            setAccessToken(res.data.accessToken);
            setMsg("Refreshed");
            return;
        }

        if (res.status === 401) setMsg("No/invalid refresh cookie");
        else setMsg(`Error: ${res.status}`);
    }

    async function logout() {
        setMsg("");
        const res = await api<null>("/auth/logout", { method: "POST" });
        if (res.status === 204) {
            setUser(null);
            setAccessToken(null);
            setMsg("Logged out");
            return;
        }
        setMsg(`Error: ${res.status}`);
    }

    return (
        <div style={{ maxWidth: 520, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
            <h1>DocumentVault</h1>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button onClick={() => setMode("login")} disabled={mode === "login"}>Login</button>
                <button onClick={() => setMode("register")} disabled={mode === "register"}>Register</button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
                <label>
                    Email
                    <input
                        style={{ width: "100%", padding: 8, marginTop: 4 }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                    />
                </label>

                <label>
                    Password
                    <input
                        style={{ width: "100%", padding: 8, marginTop: 4 }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                </label>

                {mode === "register" ? (
                    <button onClick={register} disabled={!canSubmit}>Register</button>
                ) : (
                    <button onClick={login} disabled={!canSubmit}>Login</button>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={refresh}>Refresh</button>
                    <button onClick={logout}>Logout</button>
                </div>

                <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
                    <div><strong>Status:</strong> {msg || "-"}</div>
                    <div><strong>User:</strong> {user ? user.email : "-"}</div>
                    <div style={{ wordBreak: "break-all" }}>
                        <strong>Access token:</strong> {accessToken ? accessToken : "-"}
                    </div>
                </div>
            </div>
        </div>
    );
}