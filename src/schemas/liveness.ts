import { z } from "zod";

export const livenessSchema = z.object({
  first_image: z.string().min(1, "First selfie is required"),
  second_image: z.string().min(1, "Second selfie is required"),
});
