import dynamic from "next/dynamic";

import { CATEGORY_OPTIONS, MONEY_SOURCE_OPTIONS } from "@/data/transactionSeedOptions";

const TransactionForm = dynamic(() => import("@/components/TransactionForm"));

const HomePage = (): React.JSX.Element => {
  return (
    <main className="min-h-screen bg-bg px-4 py-8 text-fg">
      <h1 className="mb-6 text-2xl font-semibold">Finanzas personales</h1>
      <TransactionForm moneySourceOptions={MONEY_SOURCE_OPTIONS} categoryOptions={CATEGORY_OPTIONS} />
    </main>
  );
};

export default HomePage;
