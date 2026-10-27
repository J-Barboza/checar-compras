import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { formatMoney } from '../domain/money';
import { receiptResult, type Receipt } from '../domain/purchase';
import { Badge, Header, T } from '../ui/components';
import { colors } from '../ui/theme';

export const receiptDate = (at: number) => new Date(at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Concluded purchases kept for 30 days (spec 4.9); tapping one opens the review. */
export function HistoryScreen({ receipts, onBack, onOpen }: { receipts: Receipt[]; onBack: () => void; onOpen: (r: Receipt) => void }) {
  return (
    <>
      <Header title="Compras anteriores" subtitle="Guardadas por 30 dias" onBack={onBack} />
      <FlatList
        data={receipts}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={<T muted style={{ textAlign: 'center', marginTop: 40 }}>Nenhuma compra concluída nos últimos 30 dias.</T>}
        renderItem={({ item }) => {
          const res = receiptResult(item);
          return (
            <Pressable accessibilityRole="button" onPress={() => onOpen(item)} style={({ pressed }) => [st.row, pressed && { opacity: 0.8 }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T bold numberOfLines={1}>{item.market}</T>
                <T muted style={{ fontSize: 15 }}>
                  {receiptDate(item.at)} · {formatMoney(res.total)}
                </T>
              </View>
              <Badge label={res.ok ? 'OK' : 'Divergente'} tone={res.ok ? 'ok' : 'bad'} />
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.ink} />
            </Pressable>
          );
        }}
      />
    </>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingLeft: 14, paddingRight: 8, paddingVertical: 8 },
});
