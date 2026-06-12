import { Balance, Expense, Member, Settlement } from '../types';

export function calculateBalances(members: Member[], expenses: Expense[]): Balance[] {
  const net = new Map<string, number>();
  for (const member of members) {
    net.set(member.id, 0);
  }

  for (const expense of expenses) {
    net.set(expense.paidByMemberId, (net.get(expense.paidByMemberId) ?? 0) + expense.amount);
    for (const share of expense.shares) {
      net.set(share.memberId, (net.get(share.memberId) ?? 0) - share.amount);
    }
  }

  return members.map((member) => ({
    memberId: member.id,
    memberName: member.name,
    net: round2(net.get(member.id) ?? 0),
  }));
}

// Greedy algorithm: match the largest debtor with the largest creditor repeatedly.
export function calculateSettlements(balances: Balance[]): Settlement[] {
  const creditors = balances
    .filter((b) => b.net > 0.005)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.net - a.net);
  const debtors = balances
    .filter((b) => b.net < -0.005)
    .map((b) => ({ ...b, net: -b.net }))
    .sort((a, b) => b.net - a.net);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.net, creditor.net);

    if (amount > 0.005) {
      settlements.push({
        fromMemberId: debtor.memberId,
        fromMemberName: debtor.memberName,
        toMemberId: creditor.memberId,
        toMemberName: creditor.memberName,
        amount: round2(amount),
      });
    }

    debtor.net -= amount;
    creditor.net -= amount;

    if (debtor.net <= 0.005) i++;
    if (creditor.net <= 0.005) j++;
  }

  return settlements;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function equalSplit(amount: number, memberIds: string[]): { memberId: string; amount: number }[] {
  const count = memberIds.length;
  const base = Math.floor((amount / count) * 100) / 100;
  const remainder = round2(amount - base * count);

  return memberIds.map((memberId, index) => {
    // distribute the rounding remainder cents to the first members
    const extra = index < Math.round(remainder * 100) ? 0.01 : 0;
    return { memberId, amount: round2(base + extra) };
  });
}
