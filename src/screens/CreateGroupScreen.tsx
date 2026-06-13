import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { addMember, createGroup } from '../db/repository';
import { GROUP_ICON_OPTIONS } from '../utils/categories';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateGroup'>;

const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY'];

export default function CreateGroupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [icon, setIcon] = useState<string | null>(null);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [memberNames, setMemberNames] = useState<string[]>(['', '']);

  const updateMemberName = (index: number, value: string) => {
    const next = [...memberNames];
    next[index] = value;
    setMemberNames(next);
  };

  const addMemberField = () => setMemberNames([...memberNames, '']);

  const removeMemberField = (index: number) => {
    if (memberNames.length <= 1) return;
    setMemberNames(memberNames.filter((_, i) => i !== index));
  };

  const canSave = name.trim().length > 0 && memberNames.some((n) => n.trim().length > 0);

  const handleSave = () => {
    const group = createGroup(name.trim(), currency, icon);
    memberNames
      .map((n) => n.trim())
      .filter((n) => n.length > 0)
      .forEach((n) => addMember(group.id, n));

    navigation.replace('GroupDetail', { groupId: group.id });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Group name</Text>
        <View style={styles.descriptionRow}>
          <Pressable style={styles.iconButton} onPress={() => setIconPickerVisible(true)}>
            {icon ? (
              <Text style={styles.iconButtonText}>{icon}</Text>
            ) : (
              <Ionicons name="flag-outline" size={22} color="#4f6df5" />
            )}
          </Pressable>
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="e.g. Weekend Trip"
            value={name}
            onChangeText={setName}
          />
        </View>

        <Modal visible={iconPickerVisible} transparent animationType="fade" onRequestClose={() => setIconPickerVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setIconPickerVisible(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Choose an icon</Text>
              <View style={styles.emojiGrid}>
                {icon !== null && (
                  <Pressable
                    style={styles.emojiOption}
                    onPress={() => {
                      setIcon(null);
                      setIconPickerVisible(false);
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={28} color="#8a8a9e" />
                  </Pressable>
                )}
                {GROUP_ICON_OPTIONS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    style={styles.emojiOption}
                    onPress={() => {
                      setIcon(emoji);
                      setIconPickerVisible(false);
                    }}
                  >
                    <Text style={styles.emojiOptionText}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Text style={styles.label}>Currency</Text>
        <View style={styles.currencyRow}>
          {CURRENCIES.map((c) => (
            <Pressable
              key={c}
              style={[styles.currencyChip, currency === c && styles.currencyChipActive]}
              onPress={() => setCurrency(c)}
            >
              <Text style={[styles.currencyChipText, currency === c && styles.currencyChipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Members</Text>
        {memberNames.map((value, index) => (
          <View key={index} style={styles.memberRow}>
            <TextInput
              style={[styles.input, styles.memberInput]}
              placeholder={`Member ${index + 1}`}
              value={value}
              onChangeText={(text) => updateMemberName(index, text)}
            />
            <Pressable onPress={() => removeMemberField(index)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>✕</Text>
            </Pressable>
          </View>
        ))}
        <Pressable onPress={addMemberField} style={styles.addMemberButton}>
          <Text style={styles.addMemberButtonText}>+ Add member</Text>
        </Pressable>

        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveButtonText}>Create group</Text>
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
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: { fontSize: 24 },
  nameInput: { flex: 1 },
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
  currencyRow: { flexDirection: 'row', gap: 8 },
  currencyChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f1f7',
  },
  currencyChipActive: { backgroundColor: '#4f6df5' },
  currencyChipText: { color: '#1a1a2e', fontWeight: '600' },
  currencyChipTextActive: { color: '#fff' },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  memberInput: { flex: 1 },
  removeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#f5f5fa',
  },
  removeButtonText: { color: '#8a8a9e', fontSize: 16 },
  addMemberButton: { marginTop: 4, marginBottom: 16 },
  addMemberButtonText: { color: '#4f6df5', fontWeight: '600', fontSize: 15 },
  saveButton: {
    backgroundColor: '#4f6df5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: { backgroundColor: '#c0c8f7' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
