export type RootStackParamList = {
  Groups: undefined;
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
  AddExpense: { groupId: string; expenseId?: string };
  ManageMembers: { groupId: string };
};
