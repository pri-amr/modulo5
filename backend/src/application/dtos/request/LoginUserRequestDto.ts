import { z } from "zod";

export const LoginUserRequestSchema = z
    .object({
        email: z.string().trim().email("email debe tener un formato válido"),
        password: z.string().min(1, "password es requerida")
    })
    .strict();

export type LoginUserRequestDto = z.infer<typeof LoginUserRequestSchema>;
