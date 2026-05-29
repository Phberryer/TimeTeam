import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginButton } from "@/components/login-button";
import { Clock } from "lucide-react";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-4 rounded-2xl">
            <Clock className="h-10 w-10 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">TimeTeam</h1>
          <p className="mt-2 text-gray-500">
            Gestion des feuilles de temps
          </p>
        </div>
        <div className="border-t pt-6">
          <p className="text-sm text-gray-500 mb-4">
            Connectez-vous avec votre compte Microsoft Office 365
          </p>
          <LoginButton />
        </div>
        <p className="text-xs text-gray-400">
          Accès réservé aux membres de l'équipe
        </p>
      </div>
    </div>
  );
}
