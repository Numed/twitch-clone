import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

export async function createClient() {
  const cookieStore = await cookies();
  const { getToken } = await auth();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await getToken({ template: "supabase" });

          if (!clerkToken) {
            console.error("Failed to retrieve Clerk token");
            throw new Error("Authentication error");
          }

          const headers = new Headers(options.headers || {});
          headers.set("Authorization", `Bearer ${clerkToken}`);

          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    }
  );
}
