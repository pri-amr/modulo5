import dynamic from "next/dynamic";

import { CATEGORY_OPTIONS, MONEY_SOURCE_OPTIONS } from "@/data/transactionSeedOptions";

const TransactionForm = dynamic(() => import("@/components/TransactionForm"));

const HomePage = (): React.JSX.Element => {
  return (
    <main>
      <h1>Finanzas personales</h1>
      <TransactionForm moneySourceOptions={MONEY_SOURCE_OPTIONS} categoryOptions={CATEGORY_OPTIONS} />
    </main>
  );
};

export default HomePage;
