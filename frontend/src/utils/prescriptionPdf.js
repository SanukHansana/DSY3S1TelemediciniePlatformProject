const hospital = {
  name: "Ceylon MediHub",
  address: "No. 42, Galle Road, Colombo 03, Sri Lanka",
  telephone: "+94 11 234 5678",
  fax: "+94 11 234 5679",
  email: "info@CeylonMediHub.com",
  website: "www.CeylonMediHub.com"
};

const page = {
  width: 595.28,
  height: 841.89,
  margin: 48
};

const escapePdfText = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");

const toAscii = (value) =>
  String(value ?? "")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, "");

const formatDate = (value) => {
  if (!value) return "Not specified";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not specified" : date.toLocaleDateString();
};

const wrapText = (value, maxChars) => {
  const words = toAscii(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [""];
};

const textCommand = (x, y, size, value) =>
  `BT /F1 ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(
    toAscii(value)
  )}) Tj ET\n`;

const lineCommand = (x1, y1, x2, y2) =>
  `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S\n`;

const rectCommand = (x, y, width, height) =>
  `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S\n`;

const setRgb = (r, g, b) =>
  `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg ${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} RG\n`;

const dataUrlToBinary = (dataUrl) => {
  const [, base64 = ""] = dataUrl.split(",");
  const raw = atob(base64);
  let binary = "";

  for (let index = 0; index < raw.length; index += 1) {
    binary += String.fromCharCode(raw.charCodeAt(index));
  }

  return binary;
};

const loadLogoAsJpeg = async () => {
  try {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = "/mainlogo.png";

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);

    return {
      width: canvas.width,
      height: canvas.height,
      binary: dataUrlToBinary(canvas.toDataURL("image/jpeg", 0.88))
    };
  } catch (error) {
    return null;
  }
};

const buildPdfBinary = ({ content, logo }) => {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"
  ];

  const resources = logo
    ? "<< /Font << /F1 4 0 R >> /XObject << /Logo 5 0 R >> >>"
    : "<< /Font << /F1 4 0 R >> >>";

  objects.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources ${resources} /Contents ${
      logo ? 6 : 5
    } 0 R >>`
  );
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  if (logo) {
    objects.push(
      `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.binary.length} >>\nstream\n${logo.binary}\nendstream`
    );
  }

  objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
};

const binaryToBlob = (binary) => {
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: "application/pdf" });
};

const binaryToBase64 = (binary) => {
  const chunkSize = 8190;
  let output = "";

  for (let index = 0; index < binary.length; index += chunkSize) {
    output += btoa(binary.slice(index, index + chunkSize));
  }

  return output;
};

const downloadBinary = (binary, fileName) => {
  const blob = binaryToBlob(binary);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const buildPrescriptionPdf = async ({ prescription, patient }) => {
  const logo = await loadLogoAsJpeg();
  const doctor = prescription.doctor || {};
  const doctorName = doctor.full_name || prescription.doctor_id || "Doctor";
  const qualifications = Array.isArray(doctor.qualifications)
    ? doctor.qualifications.join(", ")
    : doctor.qualifications || "";
  const patientName =
    patient.full_name ||
    patient.name ||
    patient.email ||
    prescription.patient_id ||
    "Patient";
  const issuedDate = formatDate(prescription.issued_at || prescription.created_at);
  const followUpDate = formatDate(prescription.follow_up_date);
  const medications = Array.isArray(prescription.medications)
    ? prescription.medications
    : [];

  let y = 780;
  let content = "1 w\n";

  if (logo) {
    content += `q 46 0 0 46 48 750 cm /Logo Do Q\n`;
  }

  content += setRgb(18, 120, 94);
  content += textCommand(104, 784, 22, hospital.name);
  content += setRgb(55, 80, 71);
  content += textCommand(104, 766, 9, hospital.address);
  content += textCommand(
    104,
    752,
    9,
    `Tel: ${hospital.telephone}  |  Fax: ${hospital.fax}`
  );
  content += textCommand(
    104,
    738,
    9,
    `Email: ${hospital.email}  |  Web: ${hospital.website}`
  );
  content += setRgb(18, 120, 94);
  content += lineCommand(page.margin, 724, page.width - page.margin, 724);

  content += setRgb(21, 47, 40);
  content += textCommand(210, 696, 18, "Digital Prescription");
  y = 664;

  content += setRgb(55, 80, 71);
  content += textCommand(page.margin, y, 10, `Prescription ID: ${prescription._id}`);
  content += textCommand(340, y, 10, `Issued Date: ${issuedDate}`);
  y -= 18;
  content += textCommand(page.margin, y, 10, `Patient: ${patientName}`);
  content += textCommand(340, y, 10, `Patient ID: ${prescription.patient_id}`);
  y -= 18;
  content += textCommand(page.margin, y, 10, `Doctor: ${doctorName}`);
  content += textCommand(340, y, 10, `Appointment ID: ${prescription.appointment_id || "N/A"}`);
  y -= 18;
  content += textCommand(page.margin, y, 10, `Follow-up Date: ${followUpDate}`);
  y -= 28;

  content += setRgb(18, 120, 94);
  content += textCommand(page.margin, y, 13, "Diagnosis");
  y -= 16;
  content += setRgb(55, 80, 71);
  for (const line of wrapText(prescription.diagnosis || "Not specified", 88)) {
    content += textCommand(page.margin, y, 10, line);
    y -= 14;
  }
  y -= 8;

  content += setRgb(18, 120, 94);
  content += textCommand(page.margin, y, 13, "Medications");
  y -= 18;
  content += rectCommand(page.margin, y - 16, page.width - page.margin * 2, 22);
  content += setRgb(21, 47, 40);
  content += textCommand(56, y - 8, 9, "Medication");
  content += textCommand(214, y - 8, 9, "Dosage");
  content += textCommand(312, y - 8, 9, "Frequency");
  content += textCommand(420, y - 8, 9, "Duration");
  y -= 32;

  content += setRgb(55, 80, 71);
  medications.forEach((item, index) => {
    if (y < 150) return;
    content += textCommand(56, y, 9, `${index + 1}. ${item.medication_name || "Medication"}`);
    content += textCommand(214, y, 9, item.dosage || "-");
    content += textCommand(312, y, 9, item.frequency || "-");
    content += textCommand(420, y, 9, item.duration || "-");
    y -= 16;

    if (item.instructions) {
      for (const line of wrapText(`Instructions: ${item.instructions}`, 92)) {
        if (y < 150) return;
        content += textCommand(72, y, 8, line);
        y -= 12;
      }
    }
  });

  if (!medications.length) {
    content += textCommand(56, y, 9, "No medications listed");
    y -= 16;
  }

  y -= 12;
  content += setRgb(18, 120, 94);
  content += textCommand(page.margin, y, 13, "Doctor Notes");
  y -= 16;
  content += setRgb(55, 80, 71);
  for (const line of wrapText(prescription.notes || "No additional notes.", 92)) {
    if (y < 124) break;
    content += textCommand(page.margin, y, 9, line);
    y -= 13;
  }

  content += setRgb(18, 120, 94);
  content += lineCommand(page.margin, 104, 238, 104);
  content += setRgb(21, 47, 40);
  content += textCommand(page.margin, 86, 10, doctorName);
  content += textCommand(
    page.margin,
    72,
    8,
    qualifications || doctor.specialty || "Registered Medical Practitioner"
  );
  content += textCommand(
    page.margin,
    58,
    8,
    doctor.license_number ? `License No: ${doctor.license_number}` : "Digital prescription issued by Ceylon MediHub"
  );

  content += setRgb(97, 117, 109);
  content += textCommand(
    340,
    72,
    8,
    "This prescription was generated electronically."
  );
  content += textCommand(340, 58, 8, hospital.website);

  const binary = buildPdfBinary({ content, logo });
  const fileName = `prescription-${prescription._id || "download"}.pdf`;

  return {
    binary,
    fileName
  };
};

export const createPrescriptionPdfPayload = async ({ prescription, patient }) => {
  const { binary, fileName } = await buildPrescriptionPdf({
    prescription,
    patient
  });
  const base64 = binaryToBase64(binary);

  return {
    fileName,
    base64,
    dataUrl: `data:application/pdf;base64,${base64}`
  };
};

export const downloadPrescriptionPdf = async ({ prescription, patient }) => {
  const { binary, fileName } = await buildPrescriptionPdf({
    prescription,
    patient
  });

  downloadBinary(binary, fileName);
};
