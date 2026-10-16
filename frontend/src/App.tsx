import { useState } from "react";
import { NavBar } from "./components/navBar";
import { ScanPage } from "./screens/scanner/ScannerScreen";
import { PantreePage } from "./screens/Pantree";

function App() {
  const [selectedPage, setSelectedPage] = useState<string>("Home");

  return (
    <div className="flex flex-col h-dvh grow-0">
      <div className="flex-1 overflow-auto pt-safe-top pb-16">
        {selectedPage === "Scan" ? (
          <ScanPage />
        ) : selectedPage === "Pantree" ? (
          <PantreePage />
        ) : (
          <div />
        )}
      </div>
      <NavBar fixed={true} selectedPage={selectedPage} setSelectPage={setSelectedPage} />
    </div>
  );
}

export default App;
