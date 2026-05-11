"use server";

import { redirect } from "next/navigation";

import { getBaseUrl } from "@/lib/auth/get-base-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const toMessagePath = (path: string, type: "error" | "success", message: string) =>
  `${path}?${new URLSearchParams({ [type]: message }).toString()}`;

export async function signInTeacher(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(toMessagePath("/auth/sign-in", "error", "Enter your email and password."));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(toMessagePath("/auth/sign-in", "error", error.message));
  }

  redirect("/teacher");
}

export async function signUpTeacher(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(toMessagePath("/auth/sign-up", "error", "Enter your email and password."));
  }

  const baseUrl = await getBaseUrl();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${baseUrl}/auth/confirm?next=/teacher`,
    },
  });

  if (error) {
    redirect(toMessagePath("/auth/sign-up", "error", error.message));
  }

  redirect(
    toMessagePath(
      "/auth/sign-in",
      "success",
      "Check your email to confirm your account, then sign in.",
    ),
  );
}

export async function signOutTeacher() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
