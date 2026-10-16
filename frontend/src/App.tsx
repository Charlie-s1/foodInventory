import { useEffect, useState } from "react";
import { NavBar } from "./components/navBar";
import { ScanPage } from "./screens/scanner/ScannerScreen";
import { PantreePage } from "./screens/Pantree";

function App() {
  const [selectedPage, setSelectedPage] = useState<string>("Home");

  return (
    <div className="flex flex-col h-dvh">
      <div className="h-full">
        {selectedPage === "Scan" ? (
          <ScanPage />
        ) : selectedPage === "Pantree" ? (
          <PantreePage />
        ) : (
          <div />
        )}
      </div>
      <div className="bottom-0 left-0 w-full">
        <NavBar selectedPage={selectedPage} setSelectPage={setSelectedPage} />
      </div>
    </div>
  );
}

export default App;
