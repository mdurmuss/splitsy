import db from './database';
import { Expense, ExpenseShare, Group, Member, SplitType } from '../types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// --- Groups ---

export function createGroup(name: string, currency: string, icon: string | null = null): Group {
  const group: Group = {
    id: generateId(),
    name,
    currency,
    icon,
    createdAt: Date.now(),
  };
  db.runSync(
    'INSERT INTO groups (id, name, currency, icon, createdAt) VALUES (?, ?, ?, ?, ?)',
    [group.id, group.name, group.currency, group.icon, group.createdAt]
  );
  return group;
}

export function getGroups(): Group[] {
  return db.getAllSync<Group>('SELECT * FROM groups ORDER BY createdAt DESC');
}

export function getGroup(groupId: string): Group | null {
  return db.getFirstSync<Group>('SELECT * FROM groups WHERE id = ?', [groupId]);
}

export function deleteGroup(groupId: string): void {
  db.runSync('DELETE FROM expense_shares WHERE expenseId IN (SELECT id FROM expenses WHERE groupId = ?)', [groupId]);
  db.runSync('DELETE FROM expenses WHERE groupId = ?', [groupId]);
  db.runSync('DELETE FROM members WHERE groupId = ?', [groupId]);
  db.runSync('DELETE FROM groups WHERE id = ?', [groupId]);
}

// --- Members ---

export function addMember(groupId: string, name: string): Member {
  const member: Member = { id: generateId(), groupId, name };
  db.runSync('INSERT INTO members (id, groupId, name) VALUES (?, ?, ?)', [
    member.id,
    member.groupId,
    member.name,
  ]);
  return member;
}

export function getMembers(groupId: string): Member[] {
  return db.getAllSync<Member>('SELECT * FROM members WHERE groupId = ?', [groupId]);
}

export function removeMember(memberId: string): void {
  db.runSync('DELETE FROM members WHERE id = ?', [memberId]);
}

// --- Expenses ---

export function addExpense(
  groupId: string,
  description: string,
  amount: number,
  paidByMemberId: string,
  splitType: SplitType,
  category: string,
  icon: string | null,
  shares: ExpenseShare[],
  date: number = Date.now()
): Expense {
  const expense: Expense = {
    id: generateId(),
    groupId,
    description,
    amount,
    paidByMemberId,
    splitType,
    category,
    icon,
    date,
    shares,
  };

  db.runSync(
    'INSERT INTO expenses (id, groupId, description, amount, paidByMemberId, splitType, category, icon, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [expense.id, expense.groupId, expense.description, expense.amount, expense.paidByMemberId, expense.splitType, expense.category, expense.icon, expense.date]
  );

  for (const share of shares) {
    db.runSync('INSERT INTO expense_shares (id, expenseId, memberId, amount) VALUES (?, ?, ?, ?)', [
      generateId(),
      expense.id,
      share.memberId,
      share.amount,
    ]);
  }

  return expense;
}

export function getExpenses(groupId: string): Expense[] {
  const rows = db.getAllSync<Omit<Expense, 'shares'>>(
    'SELECT * FROM expenses WHERE groupId = ? ORDER BY date DESC',
    [groupId]
  );

  return rows.map((row) => {
    const shares = db.getAllSync<ExpenseShare>(
      'SELECT memberId, amount FROM expense_shares WHERE expenseId = ?',
      [row.id]
    );
    return { ...row, shares };
  });
}

export function getExpense(expenseId: string): Expense | null {
  const row = db.getFirstSync<Omit<Expense, 'shares'>>('SELECT * FROM expenses WHERE id = ?', [expenseId]);
  if (!row) return null;
  const shares = db.getAllSync<ExpenseShare>(
    'SELECT memberId, amount FROM expense_shares WHERE expenseId = ?',
    [row.id]
  );
  return { ...row, shares };
}

export function updateExpense(
  expenseId: string,
  description: string,
  amount: number,
  paidByMemberId: string,
  splitType: SplitType,
  category: string,
  icon: string | null,
  shares: ExpenseShare[],
  date: number
): void {
  db.runSync(
    'UPDATE expenses SET description = ?, amount = ?, paidByMemberId = ?, splitType = ?, category = ?, icon = ?, date = ? WHERE id = ?',
    [description, amount, paidByMemberId, splitType, category, icon, date, expenseId]
  );

  db.runSync('DELETE FROM expense_shares WHERE expenseId = ?', [expenseId]);
  for (const share of shares) {
    db.runSync('INSERT INTO expense_shares (id, expenseId, memberId, amount) VALUES (?, ?, ?, ?)', [
      generateId(),
      expenseId,
      share.memberId,
      share.amount,
    ]);
  }
}

export function deleteExpense(expenseId: string): void {
  db.runSync('DELETE FROM expense_shares WHERE expenseId = ?', [expenseId]);
  db.runSync('DELETE FROM expenses WHERE id = ?', [expenseId]);
}
