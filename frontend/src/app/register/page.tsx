import dynamic from "next/dynamic";

const RegisterForm = dynamic(() => import("@/components/RegisterForm"));

const RegisterPage = (): React.JSX.Element => {
  return (
    <main className="min-h-screen bg-bg px-4 py-8 text-fg">
      <h1 className="mb-6 text-2xl font-semibold">Crear cuenta</h1>
      <RegisterForm />
    </main>
  );
};

export default RegisterPage;
