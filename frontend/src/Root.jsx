import { useState } from "react";
import Landing from "./Landing.jsx";
import App from "./App.jsx"; // your existing chat, unchanged

export default function Root() {
  const [entered, setEntered] = useState(false);
  return entered ? <App /> : <Landing onEnter={() => setEntered(true)} />;
}