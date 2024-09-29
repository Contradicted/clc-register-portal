"use client";

import { SessionProvider } from "next-auth/react";
import { useMemo } from "react";

export default function NextAuthProvider({ children, session, sessionKey }) {
  const memoizedSessionKey = useMemo(() => {
    console.log("session changed >>> ", session);

    return sessionKey;
  }, [session]);

  return (
    <SessionProvider key={memoizedSessionKey} session={session}>
      {children}
    </SessionProvider>
  );
}
