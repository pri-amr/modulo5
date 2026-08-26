import { act, renderHook, waitFor } from "@testing-library/react";

import { useRegisterUser, type RegisterFormValues } from "@/hooks/useRegisterUser";
import { AuthService } from "@/services/AuthService";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("../../services/AuthService", () => ({
  AuthService: { registerUser: jest.fn() },
}));

const mockedRegisterUser = AuthService.registerUser as jest.Mock;

const VALID_VALUES: RegisterFormValues = {
  name: "Ana López",
  email: "ana@example.com",
  password: "password123",
  confirmPassword: "password123",
};

describe("useRegisterUser", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("useRegisterUser redirige a /login tras un registro exitoso (valida AC-01, FR-07)", async () => {
    mockedRegisterUser.mockResolvedValueOnce({
      id: "user-1",
      name: "Ana Lopez",
      email: "ana@example.com",
    });

    const { result } = renderHook(() => useRegisterUser());

    act(() => {
      Object.entries(VALID_VALUES).forEach(([field, value]) => {
        result.current.setFieldValue(field as keyof RegisterFormValues, value);
      });
    });

    act(() => {
      void result.current.submit();
    });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
  });

  it("useRegisterUser muestra un mensaje de error y conserva los valores del formulario si el registro falla (valida AC-07)", async () => {
    mockedRegisterUser.mockRejectedValueOnce(new Error("El email ya está registrado"));

    const { result } = renderHook(() => useRegisterUser());

    act(() => {
      Object.entries(VALID_VALUES).forEach(([field, value]) => {
        result.current.setFieldValue(field as keyof RegisterFormValues, value);
      });
    });

    act(() => {
      void result.current.submit();
    });

    await waitFor(() => expect(result.current.error).toBe("El email ya está registrado"));

    expect(result.current.values).toEqual(VALID_VALUES);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("useRegisterUser sanitiza el campo name antes de enviarlo (criterio de seguridad de AGENTS.md)", async () => {
    mockedRegisterUser.mockResolvedValueOnce({
      id: "user-2",
      name: "&lt;script&gt;",
      email: "ana@example.com",
    });

    const { result } = renderHook(() => useRegisterUser());

    act(() => {
      result.current.setFieldValue("name", "<script>");
      result.current.setFieldValue("email", VALID_VALUES.email);
      result.current.setFieldValue("password", VALID_VALUES.password);
      result.current.setFieldValue("confirmPassword", VALID_VALUES.confirmPassword);
    });

    act(() => {
      void result.current.submit();
    });

    await waitFor(() =>
      expect(mockedRegisterUser).toHaveBeenCalledWith(
        {
          name: "&lt;script&gt;",
          email: VALID_VALUES.email,
          password: VALID_VALUES.password,
          confirmPassword: VALID_VALUES.confirmPassword,
        },
        expect.any(AbortSignal),
      ),
    );
  });

  it("useRegisterUser aborta la request en curso al desmontarse y no actualiza estado del componente desmontado", async () => {
    let capturedSignal: AbortSignal | undefined;

    mockedRegisterUser.mockImplementation(
      (_dto: unknown, signal?: AbortSignal) =>
        new Promise(() => {
          capturedSignal = signal;
        }),
    );

    const { result, unmount } = renderHook(() => useRegisterUser());

    act(() => {
      Object.entries(VALID_VALUES).forEach(([field, value]) => {
        result.current.setFieldValue(field as keyof RegisterFormValues, value);
      });
    });

    act(() => {
      void result.current.submit();
    });

    await waitFor(() => expect(result.current.loading).toBe(true));

    expect(capturedSignal?.aborted).toBe(false);

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });
});
