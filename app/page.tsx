import { redirect } from "next/navigation";

/**
 * The root route renders nothing itself — the proxy decides whether the
 * visitor belongs in `/app` or at `/login`.
 */
export default function RootPage() {
  redirect("/app");
}
