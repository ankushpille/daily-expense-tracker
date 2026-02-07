import { useState } from "react";

export default function ExpenseForm() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState([
    "food",
    "petrol",
    "groceries",
    "recharge",
    "wifi",
    "home maintainence bill",
    "Power bill",
    "others",
  ]);
  const [date, setDate] = useState(null);
  const [description, setDescription] = useState("");
  const [payementMode, setPayementMode] = useState([
    "phonepe",
    "gpay",
    "paytym",
    "creditcard",
    "cash",
    "others",
  ]);

  return <></>;
}
