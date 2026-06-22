import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react";

export interface UserInfo {
  id: number;
  clerkId: string;
  email: string;
  name: string | null;
  isPremium: boolean;
  premiumUntil: string | null;
  usedToday: number;
  limit: number | null;
  remaining: number | null;
}

export function useUserInfo() {
  const { isSignedIn } = useUser();

  return useQuery<UserInfo>({
    queryKey: ["user-info"],
    queryFn: async () => {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (!res.ok) throw new Error("Gagal memuat info user");
      return res.json();
    },
    enabled: !!isSignedIn,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}
