// Example using fetch (you can use axios or any other HTTP client)

const API_BASE_URL = 'http://localhost:3001'; // Or your backend's URL

async function fetchTransactions(filters = {}) {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE_URL}/transactions?${queryParams}`); //add later the transaction query
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}

export { fetchTransactions };