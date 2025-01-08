import { useQuery } from "@tanstack/react-query";

interface UserInfo {
  user_id: string;
  image_url?: string | null;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

// Create a hook for fetching user
export function useUserInfo(userId: string) {
  return useQuery<UserInfo>({
    queryKey: ["user", userId],
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
    gcTime: 60 * 60 * 1000, // Garbage collect after 1 hour
  });
}
