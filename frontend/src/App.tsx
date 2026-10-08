import { NavBar } from "./components/navBar";
import { ScanPage } from "./screens/scanner";

function App() {
  return (
    <div className="flex flex-col h-screen">
      <div className="h-full">
        <ScanPage />
      </div>
      <div className="bottom-0 left-0 w-full">
        <NavBar />
      </div>
    </div>
  );
}

export default App;
