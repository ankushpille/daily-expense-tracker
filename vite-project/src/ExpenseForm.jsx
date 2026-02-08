import { useState } from "react";

export default function ExpenseForm() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [payementMode, setPayementMode] = useState("");

  const handleAmountOnChange = (e) => {
    setAmount(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handleCategoryOnChange = (e) => {
    setCategory(e.target.value);
  };

  const handlePayementChange = (e) => {
    setPayementMode(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };
  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>
          Enter Your amount
          <input type="text" value={amount} onChange={handleAmountOnChange} />
        </label>{" "}
        <br></br>
        <label>
          Category:
          <select value={category} onChange={handleCategoryOnChange}>
            <option value="">Select Category</option>
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Rent">Rent</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills</option>
            <option value="Others">Others</option>
          </select>
        </label>{" "}
        <br />
        <label>
          Enter your date:
          <input type="date" value={date} onChange={handleDateChange} />
        </label>
        <br />
        <label>
          description:
          <input
            type="text"
            value={description}
            onChange={handleDescriptionChange}
          />
        </label>
        <br />
        <label>
          Select payement mode:
          <select value={payementMode} onChange={handlePayementChange}>
            <option value="payement type">payement type</option>
            <option value="phonepe">Phonepe</option>
            <option value="gpay">gpay</option>
            <option value="paytym">paytym</option>
            <option value="creditcard">creditcard</option>
            <option value="debitcard">debitcard</option>
            <option value="others">others</option>
          </select>
        </label>
        <br />
        <button type="submit">Add expense</button>
      </form>
    </>
  );
}
