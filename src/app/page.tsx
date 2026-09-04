import { redirect } from "next/navigation";
import { getSessionAdmin } from "@/lib/session";
import PortalApp from "@/components/PortalApp";

export default function HomePage() {
  const admin = getSessionAdmin();
  if (!admin) {
    redirect("/login");
  }

  return <PortalApp admin={admin} />;
}
