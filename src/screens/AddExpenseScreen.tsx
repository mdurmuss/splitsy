import { useLayoutEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { addExpense, getExpense, getGroup, getMembers, updateExpense } from '../db/repository';
import { equalSplit, round2 } from '../utils/balances';
import { SplitType } from '../types';
import { CATEGORY_ICONS, EMOJI_OPTIONS, ExpenseCategory } from '../utils/categories';

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
  const [category] = useState<ExpenseCategory>(
    (existingExpense?.category as ExpenseCategory) ?? 'general'
  );
  const [icon, setIcon] = useState<string | null>(existingExpense?.icon ?? null);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [date, setDate] = useState<Date>(existingExpense ? new Date(existingExpense.date) : new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
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
      updateExpense(existingExpense.id, description.trim(), round2(numericAmount), paidByMemberId, splitType, category, icon, shares, date.getTime());
    } else {
      addExpense(groupId, description.trim(), round2(numericAmount), paidByMemberId, splitType, category, icon, shares, date.getTime());
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Description</Text>
        <View style={styles.descriptionRow}>
          <Pressable style={styles.emojiButton} onPress={() => setEmojiPickerVisible(true)}>
            {icon ? (
              <Text style={styles.emojiButtonText}>{icon}</Text>
            ) : (
              <Ionicons name={CATEGORY_ICONS[category]} size={22} color="#4f6df5" />
            )}
          </Pressable>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="e.g. Dinner"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <Modal visible={emojiPickerVisible} transparent animationType="fade" onRequestClose={() => setEmojiPickerVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setEmojiPickerVisible(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Choose an icon</Text>
              <View style={styles.emojiGrid}>
                {icon !== null && (
                  <Pressable
                    style={styles.emojiOption}
                    onPress={() => {
                      setIcon(null);
                      setEmojiPickerVisible(false);
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={28} color="#8a8a9e" />
                  </Pressable>
                )}
                {EMOJI_OPTIONS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    style={styles.emojiOption}
                    onPress={() => {
                      setIcon(emoji);
                      setEmojiPickerVisible(false);
                    }}
                  >
                    <Text style={styles.emojiOptionText}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Text style={styles.label}>Amount ({group?.currency})</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Date</Text>
        {Platform.OS === 'ios' ? (
          <View style={styles.chipRow}>
            <View style={styles.dateChip}>
              <Ionicons name="calendar-outline" size={16} color="#4f6df5" />
              <DateTimePicker
                value={date}
                mode="date"
                display="compact"
                maximumDate={new Date()}
                onChange={(_event, selected) => {
                  if (selected) {
                    setDate(selected);
                  }
                }}
              />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.chipRow}>
              <Pressable style={styles.dateChip} onPress={() => setDatePickerVisible(true)}>
                <Ionicons name="calendar-outline" size={16} color="#4f6df5" />
                <Text style={styles.dateChipText}>
                  {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </Text>
              </Pressable>
            </View>

            {datePickerVisible && (
              <DateTimePicker
                value={date}
                mode="date"
                maximumDate={new Date()}
                onChange={(_event, selected) => {
                  setDatePickerVisible(false);
                  if (selected) {
                    setDate(selected);
                  }
                }}
              />
            )}
          </>
        )}

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
  descriptionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonText: { fontSize: 24 },
  descriptionInput: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '85%',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptionText: { fontSize: 24 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f1f7',
  },
  dateChipText: { color: '#1a1a2e', fontWeight: '600' },
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
