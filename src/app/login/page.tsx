import { redirect } from "next/navigation";
import { getAdmins } from "@/lib/admins";
import { getSessionAdmin } from "@/lib/session";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  if (getSessionAdmin()) {
    redirect("/");
  }

  const admins = getAdmins();
  const passcodeRequired = Boolean(process.env.APP_PASSCODE);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        <h1 className="text-xl font-semibold text-brand-900">
          PowerSchool Support Portal
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Sign in with your name to get started.
        </p>
        <LoginForm admins={admins} passcodeRequired={passcodeRequired} />
      </div>
    </main>
  );
}
