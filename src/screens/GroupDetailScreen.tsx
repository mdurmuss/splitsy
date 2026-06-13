import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, FlatList, SectionList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { deleteExpense, getExpenses, getGroup, getMembers } from '../db/repository';
import { calculateBalances, calculateSettlements } from '../utils/balances';
import { Balance, Expense, Group, Member, Settlement } from '../types';
import { CATEGORY_ICONS, ExpenseCategory } from '../utils/categories';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupDetail'>;
type Tab = 'expenses' | 'balances';

function formatSectionDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  const sameYear = date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: sameYear ? undefined : 'numeric',
  });
}

export default function GroupDetailScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tab, setTab] = useState<Tab>('expenses');

  const load = useCallback(() => {
    setGroup(getGroup(groupId));
    setMembers(getMembers(groupId));
    setExpenses(getExpenses(groupId));
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: group?.name ?? '',
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('ManageMembers', { groupId })} style={{ marginRight: 4 }}>
          <Ionicons name="people-outline" size={22} color="#4f6df5" />
        </Pressable>
      ),
    });
  }, [navigation, group, groupId]);

  const confirmDeleteExpense = (expense: Expense) => {
    Alert.alert('Delete expense', `Delete "${expense.description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteExpense(expense.id);
          load();
        },
      },
    ]);
  };

  const memberMap = new Map(members.map((m) => [m.id, m.name]));
  const balances: Balance[] = calculateBalances(members, expenses);
  const settlements: Settlement[] = calculateSettlements(balances);

  const expenseSections = useMemo(() => {
    const groups = new Map<string, { date: Date; data: Expense[] }>();
    for (const expense of expenses) {
      const d = new Date(expense.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!groups.has(key)) {
        groups.set(key, { date: d, data: [] });
      }
      groups.get(key)!.data.push(expense);
    }
    return Array.from(groups.values()).map(({ date, data }) => ({
      title: formatSectionDate(date),
      data,
    }));
  }, [expenses]);

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <Pressable style={[styles.tab, tab === 'expenses' && styles.tabActive]} onPress={() => setTab('expenses')}>
          <Text style={[styles.tabText, tab === 'expenses' && styles.tabTextActive]}>Expenses</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'balances' && styles.tabActive]} onPress={() => setTab('balances')}>
          <Text style={[styles.tabText, tab === 'balances' && styles.tabTextActive]}>Balances</Text>
        </Pressable>
      </View>

      {tab === 'expenses' ? (
        expenses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={56} color="#c0c0c0" />
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first expense</Text>
          </View>
        ) : (
          <SectionList
            sections={expenseSections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionHeader}>{section.title}</Text>
            )}
            renderItem={({ item }) => (
              <Pressable
                style={styles.expenseCard}
                onPress={() => navigation.navigate('AddExpense', { groupId, expenseId: item.id })}
                onLongPress={() => confirmDeleteExpense(item)}
              >
                <View style={styles.expenseIcon}>
                  {item.icon ? (
                    <Text style={styles.expenseIconEmoji}>{item.icon}</Text>
                  ) : (
                    <Ionicons
                      name={CATEGORY_ICONS[item.category as ExpenseCategory] ?? CATEGORY_ICONS.general}
                      size={20}
                      color="#4f6df5"
                    />
                  )}
                </View>
                <View style={styles.expenseContent}>
                  <Text style={styles.expenseTitle}>{item.description}</Text>
                  <Text style={styles.expenseSubtitle}>
                    Paid by {memberMap.get(item.paidByMemberId) ?? 'Unknown'}
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>
                  {item.amount.toFixed(2)} {group?.currency}
                </Text>
              </Pressable>
            )}
          />
        )
      ) : (
        <FlatList
          data={[{ key: 'balances' }, { key: 'settlements' }]}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          renderItem={({ item }) =>
            item.key === 'balances' ? (
              <View>
                <Text style={styles.sectionTitle}>Balances</Text>
                {balances.map((b) => (
                  <View key={b.memberId} style={styles.balanceRow}>
                    <Text style={styles.balanceName}>{b.memberName}</Text>
                    <Text style={[styles.balanceAmount, b.net >= 0 ? styles.positive : styles.negative]}>
                      {b.net >= 0 ? '+' : ''}
                      {b.net.toFixed(2)} {group?.currency}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View>
                <Text style={styles.sectionTitle}>Suggested settlements</Text>
                {settlements.length === 0 ? (
                  <Text style={styles.emptySubtitle}>Everyone is settled up!</Text>
                ) : (
                  settlements.map((s, idx) => (
                    <View key={idx} style={styles.settlementRow}>
                      <Text style={styles.settlementText}>
                        <Text style={styles.settlementBold}>{s.fromMemberName}</Text> pays{' '}
                        <Text style={styles.settlementBold}>{s.toMemberName}</Text>
                      </Text>
                      <Text style={styles.settlementAmount}>
                        {s.amount.toFixed(2)} {group?.currency}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )
          }
        />
      )}

      {tab === 'expenses' && (
        <Pressable style={styles.fab} onPress={() => navigation.navigate('AddExpense', { groupId })}>
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#4f6df5' },
  tabText: { color: '#8a8a9e', fontWeight: '600' },
  tabTextActive: { color: '#4f6df5' },
  list: { padding: 16 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8a8a9e',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 8,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef1ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseIconEmoji: { fontSize: 18 },
  expenseContent: { flex: 1 },
  expenseTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  expenseSubtitle: { fontSize: 13, color: '#8a8a9e', marginTop: 2 },
  expenseAmount: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a2e', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#8a8a9e', marginTop: 8, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 12, marginTop: 8 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  balanceName: { fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
  balanceAmount: { fontSize: 15, fontWeight: '700' },
  positive: { color: '#2e9b5f' },
  negative: { color: '#e0543d' },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  settlementText: { fontSize: 14, color: '#1a1a2e', flex: 1 },
  settlementBold: { fontWeight: '700' },
  settlementAmount: { fontSize: 14, fontWeight: '700', color: '#4f6df5' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f6df5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
