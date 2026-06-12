import { useLayoutEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { addExpense, getExpense, getGroup, getMembers, updateExpense } from '../db/repository';
import { equalSplit, round2 } from '../utils/balances';
import { SplitType } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

export default function AddExpenseScreen({ navigation, route }: Props) {
  const { groupId, expenseId } = route.params;
  const group = getGroup(groupId);
  const members = useMemo(() => getMembers(groupId), [groupId]);
  const existingExpense = useMemo(() => (expenseId ? getExpense(expenseId) : null), [expenseId]);

  const [description, setDescription] = useState(existingExpense?.description ?? '');
  const [amount, setAmount] = useState(existingExpense ? String(existingExpense.amount) : '');
  const [paidByMemberId, setPaidByMemberId] = useState(existingExpense?.paidByMemberId ?? members[0]?.id ?? '');
  const [splitType, setSplitType] = useState<SplitType>(existingExpense?.splitType ?? 'equal');
  const [includedMemberIds, setIncludedMemberIds] = useState<string[]>(
    existingExpense ? existingExpense.shares.map((s) => s.memberId) : members.map((m) => m.id)
  );
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(
    existingExpense
      ? Object.fromEntries(existingExpense.shares.map((s) => [s.memberId, String(s.amount)]))
      : {}
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: existingExpense ? 'Edit Expense' : 'Add Expense' });
  }, [navigation, existingExpense]);

  const numericAmount = parseFloat(amount.replace(',', '.'));
  const isAmountValid = !isNaN(numericAmount) && numericAmount > 0;

  const toggleIncluded = (memberId: string) => {
    setIncludedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const customTotal = round2(
    Object.values(customAmounts).reduce((sum, v) => sum + (parseFloat(v.replace(',', '.')) || 0), 0)
  );

  const canSave =
    description.trim().length > 0 &&
    isAmountValid &&
    paidByMemberId &&
    includedMemberIds.length > 0 &&
    (splitType === 'equal' || (isAmountValid && customTotal === round2(numericAmount)));

  const handleSave = () => {
    let shares;
    if (splitType === 'equal') {
      shares = equalSplit(numericAmount, includedMemberIds);
    } else {
      shares = includedMemberIds.map((memberId) => ({
        memberId,
        amount: round2(parseFloat((customAmounts[memberId] ?? '0').replace(',', '.')) || 0),
      }));
    }

    if (existingExpense) {
      updateExpense(existingExpense.id, description.trim(), round2(numericAmount), paidByMemberId, splitType, shares);
    } else {
      addExpense(groupId, description.trim(), round2(numericAmount), paidByMemberId, splitType, shares);
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Dinner"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Amount ({group?.currency})</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Paid by</Text>
        <View style={styles.chipRow}>
          {members.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.chip, paidByMemberId === m.id && styles.chipActive]}
              onPress={() => setPaidByMemberId(m.id)}
            >
              <Text style={[styles.chipText, paidByMemberId === m.id && styles.chipTextActive]}>{m.name}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Split</Text>
        <View style={styles.chipRow}>
          <Pressable
            style={[styles.chip, splitType === 'equal' && styles.chipActive]}
            onPress={() => setSplitType('equal')}
          >
            <Text style={[styles.chipText, splitType === 'equal' && styles.chipTextActive]}>Equally</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, splitType === 'exact' && styles.chipActive]}
            onPress={() => setSplitType('exact')}
          >
            <Text style={[styles.chipText, splitType === 'exact' && styles.chipTextActive]}>Custom amounts</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>{splitType === 'equal' ? 'Split between' : 'Amounts'}</Text>
        {members.map((m) => {
          const included = includedMemberIds.includes(m.id);
          if (splitType === 'equal') {
            return (
              <Pressable key={m.id} style={styles.memberRow} onPress={() => toggleIncluded(m.id)}>
                <View style={[styles.checkbox, included && styles.checkboxChecked]}>
                  {included && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.memberName}>{m.name}</Text>
              </Pressable>
            );
          }
          return (
            <View key={m.id} style={styles.memberRow}>
              <Pressable style={[styles.checkbox, included && styles.checkboxChecked]} onPress={() => toggleIncluded(m.id)}>
                {included && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
              <Text style={styles.memberName}>{m.name}</Text>
              {included && (
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={customAmounts[m.id] ?? ''}
                  onChangeText={(text) => setCustomAmounts((prev) => ({ ...prev, [m.id]: text }))}
                />
              )}
            </View>
          );
        })}

        {splitType === 'exact' && isAmountValid && (
          <Text style={styles.helperText}>
            Allocated {customTotal.toFixed(2)} / {numericAmount.toFixed(2)} {group?.currency}
          </Text>
        )}

        <Pressable style={[styles.saveButton, !canSave && styles.saveButtonDisabled]} onPress={handleSave} disabled={!canSave}>
          <Text style={styles.saveButtonText}>{existingExpense ? 'Save changes' : 'Save expense'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a2e',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f1f7' },
  chipActive: { backgroundColor: '#4f6df5' },
  chipText: { color: '#1a1a2e', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#c0c8f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#4f6df5', borderColor: '#4f6df5' },
  checkmark: { color: '#fff', fontWeight: '700', fontSize: 14 },
  memberName: { fontSize: 15, color: '#1a1a2e', flex: 1 },
  amountInput: {
    borderWidth: 1,
    borderColor: '#e0e0e8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    width: 90,
    textAlign: 'right',
  },
  helperText: { fontSize: 13, color: '#8a8a9e', marginTop: 8 },
  saveButton: { backgroundColor: '#4f6df5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  saveButtonDisabled: { backgroundColor: '#c0c8f7' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
