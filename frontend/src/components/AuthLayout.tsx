import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

const AuthLayout = ({ children }: AuthLayoutProps): React.JSX.Element => (
  <div className="flex min-h-screen w-full items-center justify-center px-4 py-8">
    {/* 75rem (=1200px) y no min-[1200px]: Tailwind 4 no compara px con el 40rem de sm:, emite el bucket px primero y el 40% quedaría muerto (ADR-007). */}
    <div
      data-testid="auth-layout-card"
      className="flex w-full max-w-4xl overflow-hidden rounded-[1rem] border border-line bg-surface sm:w-[70%] min-[75rem]:w-[40%]"
    >
      <div
        data-testid="auth-layout-icon-panel"
        className="hidden items-center justify-center bg-accent/10 p-6 sm:flex sm:w-1/2"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-16 w-16 text-accent"
          aria-hidden="true"
        >
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <circle cx="8" cy="14.5" r="1" fill="currentColor" stroke="none" />
          <path d="M7 7V5.5A2.5 2.5 0 0 1 9.5 3h5A2.5 2.5 0 0 1 17 5.5V7" />
        </svg>
      </div>
      <div
        data-testid="auth-layout-content-panel"
        className="flex w-full min-w-0 flex-col items-center justify-center p-6 sm:w-1/2"
      >
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
