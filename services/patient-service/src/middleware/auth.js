import crypto from "crypto";

const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );

  return Buffer.from(padded, "base64").toString("utf8");
};

const decodeSignature = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );

  return Buffer.from(padded, "base64");
};

const verifyJwt = (token, secret) => {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Malformed token");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = JSON.parse(decodeBase64Url(encodedHeader));
  const payload = JSON.parse(decodeBase64Url(encodedPayload));

  if (header.alg !== "HS256") {
    throw new Error("Unsupported token algorithm");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const receivedSignature = decodeSignature(encodedSignature);

  if (
    expectedSignature.length !== receivedSignature.length ||
    !crypto.timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    throw new Error("Invalid token signature");
  }

  const now = Math.floor(Date.now() / 1000);

  if (typeof payload.exp === "number" && payload.exp < now) {
    throw new Error("Token has expired");
  }

  if (typeof payload.nbf === "number" && payload.nbf > now) {
    throw new Error("Token is not active yet");
  }

  return payload;
};

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const secret = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({
      message:
        "JWT secret is not configured. Set AUTH_JWT_SECRET or JWT_SECRET to match auth-service."
    });
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  try {
    const token = authHeader.slice("Bearer ".length).trim();
    const payload = verifyJwt(token, secret);

    req.user = {
      id: payload.id,
      role: payload.role
    };
    req.tokenPayload = payload;
    req.authHeader = authHeader;

    return next();
  } catch (error) {
    return res.status(401).json({ message: error.message || "Invalid token" });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication is required" });
  }

  if (roles.length > 0 && !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  return next();
};
