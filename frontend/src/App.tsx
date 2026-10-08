import { testApi } from "./api/test";

function App() {
  const healthData = testApi();
  console.log(healthData);
  return (
    <>
      <h1 className="text-3xl font-bold">Food Inventory</h1>
    </>
  );
}

export default App;
