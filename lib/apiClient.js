async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}

export const api = {
  listBatches: () => request("/api/batches"),
  createBatch: (body) =>
    request("/api/batches", {
      method: "POST",
      body: JSON.stringify(body || {}),
    }),
  updateBatch: (batchId, body) =>
    request(`/api/batches/${batchId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  listVouchers: (batchId, search = "") =>
    request(
      `/api/batches/${batchId}/vouchers${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    ),
  importVouchers: (batchId, vouchers) =>
    request(`/api/batches/${batchId}/vouchers`, {
      method: "POST",
      body: JSON.stringify({ vouchers }),
    }),
  updateVoucher: (batchId, voucherId, body) =>
    request(`/api/batches/${batchId}/vouchers/${voucherId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteAllVouchers: (batchId) =>
    request(`/api/batches/${batchId}/vouchers`, { method: "DELETE" }),

  getReport: (batchId) => request(`/api/batches/${batchId}/report`),

  listExpenses: (batchId) => request(`/api/batches/${batchId}/expenses`),
  addExpense: (batchId, body) =>
    request(`/api/batches/${batchId}/expenses`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateExpense: (batchId, expenseId, body) =>
    request(`/api/batches/${batchId}/expenses/${expenseId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteExpense: (batchId, expenseId) =>
    request(`/api/batches/${batchId}/expenses/${expenseId}`, {
      method: "DELETE",
    }),

  listBanks: () => request("/api/banks"),
  addBank: (name) =>
    request("/api/banks", { method: "POST", body: JSON.stringify({ name }) }),
  deleteBank: (bankId) => request(`/api/banks/${bankId}`, { method: "DELETE" }),
};

export default api;
