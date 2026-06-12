import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { addMember, getExpenses, getMembers, removeMember } from '../db/repository';
import { Member } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageMembers'>;

export default function ManageMembersScreen({ route }: Props) {
  const { groupId } = route.params;
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState('');

  const load = useCallback(() => {
    setMembers(getMembers(groupId));
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = () => {
    if (!name.trim()) return;
    addMember(groupId, name.trim());
    setName('');
    load();
  };

  const handleRemove = (member: Member) => {
    const expenses = getExpenses(groupId);
    const isInvolved = expenses.some(
      (e) => e.paidByMemberId === member.id || e.shares.some((s) => s.memberId === member.id)
    );
    if (isInvolved) {
      Alert.alert('Cannot remove', `${member.name} is involved in existing expenses.`);
      return;
    }
    removeMember(member.id);
    load();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Pressable onPress={() => handleRemove(item)}>
              <Ionicons name="trash-outline" size={20} color="#e0543d" />
            </Pressable>
          </View>
        )}
      />

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="New member name"
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleAdd}
        />
        <Pressable style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  list: { padding: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  name: { fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
  addRow: { flexDirection: 'row', padding: 16, gap: 8, backgroundColor: '#fff' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4f6df5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
