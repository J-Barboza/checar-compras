import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { formatMoney } from '../domain/money';
import { purchaseTotal, unitsCount, type Purchase } from '../domain/purchase';
import { Button, T } from '../ui/components';
import { colors } from '../ui/theme';

export function HomeScreen({
  purchase,
  tolerance,
  receiptCount,
  onNew,
  onContinue,
  onHistory,
  onConfig,
}: {
  purchase: Purchase | null;
  tolerance: number;
  receiptCount: number;
  onNew: () => void;
  onContinue: () => void;
  onHistory: () => void;
  onConfig: () => void;
}) {
  const units = purchase ? unitsCount(purchase.items) : 0;
  return (
    <ScrollView contentContainerStyle={st.body}>
      <View style={st.brand}>
        <View style={st.logo}>
          <MaterialCommunityIcons name="check-bold" size={26} color="#fff" />
        </View>
        <T bold style={{ fontSize: 28 }}>Checar Compras</T>
      </View>
      <T muted style={{ fontSize: 18 }}>Registre os preços enquanto compra e confira tudo antes de pagar.</T>

      {purchase ? (
        <View style={st.card}>
          <T bold muted style={{ fontSize: 15 }}>Compra em andamento</T>
          <T bold style={{ fontSize: 22 }}>{purchase.market}</T>
          <T muted>
            {units} {units === 1 ? 'item' : 'itens'} · {formatMoney(purchaseTotal(purchase.items))}
          </T>
          <Button label="Continuar compra" size="xl" onPress={onContinue} />
        </View>
      ) : (
        <Button label="Nova compra" icon="plus" size="xl" onPress={onNew} />
      )}

      <View style={st.menu}>
        <Pressable accessibilityRole="button" onPress={onHistory} style={({ pressed }) => [st.menuRow, st.divider, pressed && { backgroundColor: colors.bg }]}>
          <T style={{ flex: 1 }}>Compras anteriores</T>
          <T muted>{receiptCount}</T>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.ink} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onConfig} style={({ pressed }) => [st.menuRow, pressed && { backgroundColor: colors.bg }]}>
          <T style={{ flex: 1 }}>Configurações</T>
          <T muted>Tolerância {formatMoney(tolerance)}</T>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.ink} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  body: { padding: 16, gap: 20 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24 },
  logo: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16, gap: 8 },
  menu: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, overflow: 'hidden' },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60, paddingLeft: 16, paddingRight: 10 },
});
