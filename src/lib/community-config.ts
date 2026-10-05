export const POLICY_VERSION = "2026-10-04";
export const MEMBER_PHOTO_LIMIT = 12;
export const serviceInfo = {
  name: process.env.NEXT_PUBLIC_SERVICE_NAME || "PHOTO ARCHIVE",
  operator: process.env.NEXT_PUBLIC_SERVICE_OPERATOR || "",
  contact: process.env.NEXT_PUBLIC_SERVICE_CONTACT || "",
};
// Opening membership requires reviewed legal text as well as backend configuration.
export const membershipEnabled = process.env.NEXT_PUBLIC_MEMBERSHIP_ENABLED === "true"
  && process.env.NEXT_PUBLIC_LEGAL_APPROVED === "true"
  && Boolean(serviceInfo.operator && serviceInfo.contact);
