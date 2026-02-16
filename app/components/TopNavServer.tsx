import { getServerUser } from "../lib/supabase/server";
import TopNav from "./TopNav";

export default async function TopNavServer() {
  const user = await getServerUser();
  return <TopNav isAuthenticated={Boolean(user)} />;
}
