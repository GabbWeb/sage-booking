"use server";

import { redirect } from "next/navigation";
import { checkPassword, setSession, clearSession } from "@/lib/auth";

export type LoginState = { error: string } | null;

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    return { error: "Wrong password." };
  }
  await setSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/login");
}
