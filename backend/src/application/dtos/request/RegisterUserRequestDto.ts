import { z } from "zod";

export const RegisterUserRequestSchema = z
    .object({
        name: z.string().trim().min(1, "name es requerido"),
        email: z.string().trim().email("email debe tener un formato válido"),
        password: z
            .string()
            .min(8, "password debe tener al menos 8 caracteres"),
        confirmPassword: z.string().min(1, "confirmPassword es requerido")
    })
    .strict()
    .refine((data) => data.password === data.confirmPassword, {
        message: "confirmPassword debe coincidir con password",
        path: ["confirmPassword"]
    });

export type RegisterUserRequestDto = z.infer<typeof RegisterUserRequestSchema>;
