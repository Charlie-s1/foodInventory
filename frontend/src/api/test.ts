export const testApi = async () => {
  try {
    const response = await fetch("api/health");

    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Server health:", data);
    return data;
  } catch (error) {
    console.error("Failed to fetch server health:", error);
    throw error;
  }
};
