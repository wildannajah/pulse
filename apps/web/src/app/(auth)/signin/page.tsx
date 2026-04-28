import type { Metadata } from "next";

import { SignInPage } from "./signin-page";

export const metadata: Metadata = {
  title: "Sign In — Pulse",
};

export default function Page() {
  return <SignInPage />;
}
