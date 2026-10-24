export function money(value) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Amount must be a positive safe integer in UGX');
  return value;
}
export function journal(lines) {
  if (!Array.isArray(lines) || lines.length < 2) throw new Error('At least two entries required');
  let total = 0n;
  for (const line of lines) {
    if (!line.account || !Number.isSafeInteger(line.amount) || line.amount === 0) throw new Error('Invalid journal entry');
    total += BigInt(line.amount);
  }
  if (total !== 0n) throw new Error('Journal must balance');
  return Object.freeze(lines.map(line => Object.freeze({...line})));
}
export function contribution(amount) { money(amount); return journal([{account:'cash',amount},{account:'member_contributions',amount:-amount}]); }
export function disbursement(amount) { money(amount); return journal([{account:'loan_principal',amount},{account:'cash',amount:-amount}]); }
export function reverse(lines) { return journal(lines.map(line => ({...line,amount:-line.amount}))); }
export function flatInterest(principal, annualBasisPoints, months) {
  money(principal);
  if (!Number.isSafeInteger(annualBasisPoints) || annualBasisPoints < 0 || annualBasisPoints > 100000) throw new Error('Invalid rate');
  if (!Number.isSafeInteger(months) || months < 1 || months > 120) throw new Error('Invalid term');
  const denominator = 120000n;
  const result = (BigInt(principal) * BigInt(annualBasisPoints) * BigInt(months) + denominator / 2n) / denominator;
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Interest exceeds supported range');
  return Number(result);
}
export function allocateRepayment(amount, principalDue, interestDue) {
  money(amount);
  for (const due of [principalDue, interestDue]) if (!Number.isSafeInteger(due) || due < 0) throw new Error('Invalid outstanding balance');
  if (BigInt(amount) > BigInt(principalDue) + BigInt(interestDue)) throw new Error('Overpayment requires a separate credit workflow');
  const interest = Math.min(amount, interestDue);
  return {interest,principal:amount-interest};
}
