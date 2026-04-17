const parseTextPayload = (text) => {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
};

const getErrorMessage = (payload) =>
  payload?.message || payload?.msg || payload?.error || "Request failed";

export const apiRequest = async (
  url,
  { method = "GET", token, body } = {}
) => {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : parseTextPayload(await response.text());

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  return payload;
};

export const downloadFile = async (url, token) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : parseTextPayload(await response.text());

    throw new Error(getErrorMessage(payload));
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);

  return {
    blob,
    fileName: match?.[1] || "download.bin"
  };
};
