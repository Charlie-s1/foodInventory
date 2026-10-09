import { useState } from "react";
import { NavBar } from "./components/navBar";
import { ScanPage } from "./screens/scanner";

function App() {
  const [selectedPage, setSelectedPage] = useState<string>("Home");
  return (
    <div className="flex flex-col h-dvh">
      <div className="h-full">{selectedPage === "Scan" && <ScanPage />}</div>
      <div className="bottom-0 left-0 w-full">
        <NavBar selectedPage={selectedPage} setSelectPage={setSelectedPage} />
      </div>
    </div>
  );
}

export default App;
