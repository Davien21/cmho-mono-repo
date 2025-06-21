// Define allowed admin control names as a readonly constant object
export const BANK_VERIFICATION_ERRORS = {
  INVALID_BANK_CODE: "invalid_bank_code",
  INVALID_ACCOUNT_NUMBER: "invalid_account_number",
} as const;

// Create a union type from the values of AdminControlNames
export type TBankVerificationErrors =
  (typeof BANK_VERIFICATION_ERRORS)[keyof typeof BANK_VERIFICATION_ERRORS];
