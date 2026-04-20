import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // V2: route based on userType
  if (session.user.userType === "CONTROLLER") {
    redirect("/firm/dashboard");
  }

  // CLIENT_OWNER, CLIENT_ADMIN_BANK_ONLY, or legacy users (null userType)
  redirect("/overview");
}
