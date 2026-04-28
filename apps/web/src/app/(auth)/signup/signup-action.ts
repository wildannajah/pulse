"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";

type SignUpResult = { error: string } | undefined;

export async function signUpAction(
  _prevState: SignUpResult,
  formData: FormData,
): Promise<SignUpResult> {
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    return { error: "Invalid form data" };
  }

  if (name.length < 2) {
    return { error: "Name must be at least 2 characters" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Generic message — never reveal whether email exists
    return { error: "Unable to create account. Please try again or sign in." };
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  redirect("/app");
}
