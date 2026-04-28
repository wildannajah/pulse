import type { Metadata } from "next";

import { SignUpPage } from "./signup-page";

export const metadata: Metadata = {
  title: "Sign Up — Pulse",
};

export default function Page() {
  return <SignUpPage />;
}
