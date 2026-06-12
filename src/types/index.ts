export interface Group {
  id: string;
  name: string;
  currency: string;
  createdAt: number;
}

export interface Member {
  id: string;
  groupId: string;
  name: string;
}

export type SplitType = 'equal' | 'exact' | 'percentage';

export interface ExpenseShare {
  memberId: string;
  amount: number; // amount this member owes for the expense
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidByMemberId: string;
  splitType: SplitType;
  date: number;
  shares: ExpenseShare[];
}

export interface Balance {
  memberId: string;
  memberName: string;
  net: number; // positive = is owed money, negative = owes money
}

export interface Settlement {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
}
