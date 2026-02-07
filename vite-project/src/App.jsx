import { useState } from "react";
import ExpenseForm from "./ExpenseForm";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>Daily expense tracker</h1>
      <ExpenseForm />
    </>
  );
}

export default App;
