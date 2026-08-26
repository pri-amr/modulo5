import axios from "axios";

import axiosClient from "@/lib/axiosClient";
import type { RegisterUserRequestDto, UserResponseDto } from "@/models/Auth.types";

const DEFAULT_ERROR_MESSAGE = "No se pudo registrar la cuenta. Intentá nuevamente.";

export const AuthService = {
  registerUser: async (dto: RegisterUserRequestDto, signal?: AbortSignal): Promise<UserResponseDto> => {
    try {
      const response = await axiosClient.post<UserResponseDto>("/api/auth/register", dto, {
        signal,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError<{ error?: string }>(error)) {
        throw new Error(error.response?.data?.error ?? DEFAULT_ERROR_MESSAGE);
      }

      throw error;
    }
  },
};
