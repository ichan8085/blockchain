import { BrowserRouter, Routes, Route } from "react-router-dom";
import OperatorPage from "./pages/OperatorPage";
import ValidationPage from "./pages/ValidationPage";
import ListDataPage from "./pages/ListDataPage";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ValidationPage />} />
        <Route path="/operator" element={<OperatorPage />} />
        <Route path="/list" element={<ListDataPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;