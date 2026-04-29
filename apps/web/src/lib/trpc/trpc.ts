import type { AppRouter } from "@pulse/api-types/app-router-type";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();
