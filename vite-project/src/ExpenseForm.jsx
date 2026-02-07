import { useState } from "react";

export default function ExpenseForm() {
  const [amount, setAmount] = useState(0);
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

  return (
    <>
      <form>
        <label>
          Enter Your amount
          <input type="text" value={amount} />
        </label>{" "}
        <br></br>
        <label>
          Category:
          <select>
            <option>{category[0]}</option>
            <option>{category[1]}</option>
            <option>{category[2]}</option>
            <option>{category[3]}</option>
            <option>{category[4]}</option>
            <option>{category[5]}</option>
            <option>{category[6]}</option>
          </select>
        </label>{" "}
        <br />
        <label>
          Enter your date:
          <input type="date" value={date} />
        </label>
        <br />
        <label>
          description:
          <input type="text" value={description} />
        </label>
        <br />
        <label>
          Select payement mode:
          <select>
            <option>{payementMode[0]}</option>
            <option>{payementMode[1]}</option>
            <option>{payementMode[2]}</option>
            <option>{payementMode[3]}</option>
            <option>{payementMode[4]}</option>
            <option>{payementMode[5]}</option>
          </select>
        </label>
      </form>
    </>
  );
}
