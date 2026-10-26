import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { formatKg, formatMoney } from '../domain/money';
import { lineTotal, type Item } from '../domain/purchase';
import { Badge, T } from './components';
import { colors } from './theme';

export function itemSubtitle(it: Item): string {
  const pre = it.kind === 'flv' ? 'FLV · ' : '';
  if (it.mode === 'kg') {
    if (it.kg == null) return pre + 'peso e preço pendentes';
    return it.unitPrice == null ? `${pre}${formatKg(it.kg)} kg · sem preço` : `${pre}${formatKg(it.kg)} kg × ${formatMoney(it.unitPrice)}/kg`;
  }
  return it.unitPrice == null ? `${pre}${it.qty} un. · toque para informar o preço` : `${pre}${it.qty} × ${formatMoney(it.unitPrice)}`;
}

/** One line of the purchase. With `checkable`, tapping marks it as checked (conferência). */
export function ItemRow({ item, onPress, checkable }: { item: Item; onPress: () => void; checkable?: boolean }) {
  const total = lineTotal(item);
  const pending = total == null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={checkable ? 'checkbox' : 'button'}
      accessibilityState={checkable ? { checked: item.checked } : undefined}
      accessibilityHint={checkable ? undefined : 'Toque para editar'}
      style={({ pressed }) => [st.row, pending && st.pending, checkable && item.checked && st.done, pressed && { opacity: 0.8 }]}
    >
      {checkable && (
        <View style={[st.check, item.checked && st.checkOn]}>
          {item.checked && <MaterialCommunityIcons name="check-bold" size={20} color="#fff" />}
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <T bold numberOfLines={1}>{item.name}</T>
        <T muted style={{ fontSize: 15 }}>{itemSubtitle(item)}</T>
      </View>
      {pending ? <Badge label="Sem preço" tone="warn" /> : <T bold style={{ fontVariant: ['tabular-nums'] }}>{formatMoney(total)}</T>}
    </Pressable>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, minHeight: 64 },
  pending: { borderWidth: 2, borderColor: colors.warn, backgroundColor: colors.warnSoft },
  done: { backgroundColor: colors.checkedRow },
  check: { width: 32, height: 32, borderRadius: 9, borderWidth: 2, borderColor: '#8A8F9C', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
