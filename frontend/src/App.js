import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CountersProvider } from "@/context/CountersContext";
import { Header } from "@/components/Header";
import { Ticker } from "@/components/Ticker";
import { Footer } from "@/components/Footer";
import Dashboard from "@/pages/Dashboard";

function App() {
  return (
    <div className="App">
      <CountersProvider>
        <BrowserRouter>
          <Header />
          <Ticker />
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </CountersProvider>
    </div>
  );
}

export default App;
