import { z } from "zod";

export const cuidSchema = z
  .string()
  .min(1)
  .regex(/^c[a-z0-9]{24}$/i, "Invalid CUID");
