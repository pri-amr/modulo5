import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

const AuthLayout = ({ children }: AuthLayoutProps): React.JSX.Element => (
  <div className="flex min-h-screen w-full items-center justify-center px-4 py-8">
    <div
      data-testid="auth-layout-card"
      className="flex w-full max-w-4xl overflow-hidden rounded-field border border-line bg-surface sm:w-[40%]"
    >
      <div
        data-testid="auth-layout-icon-panel"
        className="hidden w-2/5 items-center justify-center bg-accent/10 p-6 sm:flex"
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
        className="flex w-full flex-col items-center justify-center p-6"
      >
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
