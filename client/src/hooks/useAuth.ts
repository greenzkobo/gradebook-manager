import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/auth";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    role: user?.role ?? null,
  };
}
