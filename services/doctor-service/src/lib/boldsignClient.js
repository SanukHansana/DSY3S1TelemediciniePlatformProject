const BOLDSIGN_API_BASE_URL =
  process.env.BOLDSIGN_API_BASE_URL || "https://api.boldsign.com";

const readBooleanEnv = (name, fallback) => {
  const value = process.env[name];

  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(
    String(value).trim().toLowerCase()
  );
};

const readNumberEnv = (name, fallback) => {
  const value = Number(process.env[name]);

  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const getApiKey = () => String(process.env.BOLDSIGN_API_KEY || "").trim();

const getSignatureBounds = () => ({
  X: readNumberEnv("BOLDSIGN_SIGNATURE_X", 48),
  Y: readNumberEnv("BOLDSIGN_SIGNATURE_Y", 690),
  Width: readNumberEnv("BOLDSIGN_SIGNATURE_WIDTH", 190),
  Height: readNumberEnv("BOLDSIGN_SIGNATURE_HEIGHT", 58)
});

const parseResponseBody = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
};

const requestBoldSign = async (
  path,
  { method = "GET", headers = {}, body, responseType = "json" } = {}
) => {
  const apiKey = getApiKey();

  if (!apiKey || apiKey === "paste_your_boldsign_api_key_here") {
    const error = new Error("BoldSign API key is not configured");
    error.status = 500;
    throw error;
  }

  const response = await fetch(`${BOLDSIGN_API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: responseType === "buffer" ? "application/pdf" : "application/json",
      "X-API-KEY": apiKey,
      ...headers
    },
    body
  });

  if (!response.ok) {
    const payload = await parseResponseBody(response);
    const error = new Error(
      payload?.message ||
        payload?.error ||
        payload?.title ||
        `BoldSign request failed with ${response.status}`
    );
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  if (responseType === "buffer") {
    return Buffer.from(await response.arrayBuffer());
  }

  return parseResponseBody(response);
};

const normalizePdfDataUrl = (value) => {
  const pdfBase64 = String(value || "").trim();

  if (!pdfBase64) {
    return "";
  }

  if (pdfBase64.startsWith("data:application/pdf;base64,")) {
    return pdfBase64;
  }

  return `data:application/pdf;base64,${pdfBase64}`;
};

export const sendPrescriptionForSignature = async ({
  prescriptionId,
  pdfBase64,
  fileName,
  title,
  doctorName,
  doctorEmail
}) => {
  const fileData = normalizePdfDataUrl(pdfBase64);

  if (!fileData) {
    const error = new Error("Prescription PDF content is required");
    error.status = 400;
    throw error;
  }

  const disableEmails = readBooleanEnv("BOLDSIGN_DISABLE_EMAILS", true);

  return requestBoldSign("/v1/document/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      Message: "Please sign this digital prescription.",
      Signers: [
        {
          Name: doctorName,
          EmailAddress: doctorEmail,
          SignerType: "Signer",
          DeliveryMode: "Email",
          Locale: "EN",
          FormFields: [
            {
              Id: "doctor_signature",
              Name: "Doctor Signature",
              FieldType: "Signature",
              PageNumber: readNumberEnv("BOLDSIGN_SIGNATURE_PAGE", 1),
              Bounds: getSignatureBounds(),
              IsRequired: true
            }
          ]
        }
      ],
      Files: [
        {
          base64: fileData,
          fileName: fileName || `prescription-${prescriptionId}.pdf`
        }
      ],
      Title: title || `Prescription ${prescriptionId}`,
      EnableEmbeddedSigning: true,
      DisableEmails: disableEmails,
      DisableSMS: true,
      EnablePrintAndSign: false,
      EnableSigningOrder: false,
      AutoDetectFields: false,
      HideDocumentId: false,
      ExpiryDateType: "Days",
      ExpiryValue: readNumberEnv("BOLDSIGN_EXPIRY_DAYS", 30),
      MetaData: {
        DocumentType: "Prescription",
        PrescriptionId: prescriptionId
      }
    })
  });
};

export const getEmbeddedSignLink = async (documentId, signerEmail) => {
  const params = new URLSearchParams({
    documentId,
    signerEmail
  });

  return requestBoldSign(`/v1/document/getEmbeddedSignLink?${params}`);
};

export const getDocumentProperties = async (documentId) => {
  const params = new URLSearchParams({
    documentId
  });

  return requestBoldSign(`/v1/document/properties?${params}`);
};

export const downloadDocument = async (documentId) => {
  const params = new URLSearchParams({
    documentId
  });

  return requestBoldSign(`/v1/document/download?${params}`, {
    responseType: "buffer"
  });
};
