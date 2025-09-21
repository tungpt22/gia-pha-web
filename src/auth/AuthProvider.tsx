// src/auth/AuthProvider.tsx
import * as React from "react";
import { loadUserInfoAnywhere, type UserInfo } from "./session";
import { setAccessToken } from "../api/usersApi";

/* CHỈNH SỬA LẦN NÀY: đảm bảo luôn set ready=true dù có lỗi */
type AuthState = {
  ready: boolean;
  userInfo: UserInfo | null;
  token: string | null;
};

const AuthContext = React.createContext<AuthState>({
  ready: false,
  userInfo: null,
  token: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    ready: false,
    userInfo: null,
    token: null,
  });

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      let info: UserInfo | null = null;
      let token: string | null = null;

      try {
        info = loadUserInfoAnywhere(); // có thể ném nếu JSON hỏng
        token = info?.access_token || null;
        if (token) setAccessToken(token); // nạp token vào http client
      } catch (err) {
        // log để bạn thấy lỗi thật trong Console thay vì “treo”
        console.error("[AuthProvider] hydrate error:", err);
        info = null;
        token = null;
      } finally {
        if (mounted) {
          setState({ ready: true, userInfo: info, token }); // ✅ luôn set ready=true
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}

/** Gate hiển thị fallback trong lúc hydrate, sau đó render children */
export function AuthGate({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { ready } = useAuth();
  if (!ready) return fallback; // ví dụ: <div style={{padding:16}}>Đang tải…</div>
  return <>{children}</>;
}
