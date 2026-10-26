import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import { formatKg, formatMoney, moneyToInput, parseMoney } from '../domain/money';
import { pendingCount, purchaseTotal, unitsCount, type Item, type ItemChanges, type Purchase } from '../domain/purchase';
import { Button, Field, Footer, Header, IconButton, Kv, Label, MoneyField, T } from '../ui/components';
import { ItemRow } from '../ui/ItemRow';
import { colors } from '../ui/theme';

const hhmm = (ms: number) => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function ListScreen({
  purchase,
  onHome,
  onCheck,
  onScan,
  onFlv,
  onUpdate,
  onRemove,
}: {
  purchase: Purchase;
  onHome: () => void;
  onCheck: () => void;
  onScan: () => void;
  onFlv: () => void;
  onUpdate: (id: number, changes: ItemChanges) => void;
  onRemove: (id: number) => void;
}) {
  const [editing, setEditing] = useState<Item | null>(null);
  const total = purchaseTotal(purchase.items);
  const pending = pendingCount(purchase.items);
  const budget = purchase.budget;
  const over = budget != null && total > budget;

  return (
    <>
      <Header
        title={purchase.market}
        subtitle={`Iniciada às ${hhmm(purchase.startedAt)}`}
        onBack={onHome}
        backIcon="home-outline"
        right={<Button label="Conferir" variant="secondary" size="sm" onPress={onCheck} />}
      />
      <FlatList
        data={purchase.items}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        renderItem={({ item }) => <ItemRow item={item} onPress={() => setEditing(item)} />}
        ListEmptyComponent={
          <View style={st.empty}>
            <MaterialCommunityIcons name="barcode-scan" size={56} color="#8A8F9C" />
            <T style={{ textAlign: 'center' }}>
              Toque em <T bold>Escanear</T> para registrar o primeiro produto.
            </T>
            <T muted style={{ textAlign: 'center' }}>
              Frutas, verduras e itens a granel: use <T bold>+ FLV</T>.
            </T>
          </View>
        }
      />
      <Footer>
        <View style={st.totalRow}>
          <T>Total registrado</T>
          <T bold style={{ fontSize: 30, fontVariant: ['tabular-nums'] }}>{formatMoney(total)}</T>
        </View>
        <View style={st.grid}>
          <View style={st.cell}><Kv label="Itens" value={String(unitsCount(purchase.items))} /></View>
          {pending > 0 && <View style={st.cell}><Kv label="Sem preço" value={String(pending)} color={colors.warn} /></View>}
          {budget != null && <View style={st.cell}><Kv label="Orçamento" value={formatMoney(budget)} /></View>}
          {budget != null && (
            <View style={st.cell}>
              <Kv label={over ? 'Passou' : 'Ainda cabe'} value={formatMoney(Math.abs(budget - total))} color={over ? colors.danger : colors.primary} />
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label="FLV" icon="plus" variant="secondary" size="xl" onPress={onFlv} />
          <Button label="Escanear" icon="barcode-scan" size="xl" onPress={onScan} style={{ flex: 1 }} />
        </View>
      </Footer>

      {editing && (
        <EditSheet
          item={editing}
          onClose={() => setEditing(null)}
          onSave={(changes) => { onUpdate(editing.id, changes); setEditing(null); }}
          onRemove={() => { onRemove(editing.id); setEditing(null); }}
        />
      )}
    </>
  );
}

function EditSheet({ item, onClose, onSave, onRemove }: { item: Item; onClose: () => void; onSave: (c: ItemChanges) => void; onRemove: () => void }) {
  const isKg = item.mode === 'kg';
  const [name, setName] = useState(item.name);
  const [qty, setQty] = useState(item.qty);
  const [kg, setKg] = useState(item.kg == null ? '' : formatKg(item.kg));
  const [price, setPrice] = useState(moneyToInput(item.unitPrice));
  const unit = parseMoney(price);
  const amount = isKg ? parseMoney(kg) : qty;
  const itemTotal = unit != null && amount != null ? formatMoney(unit * amount) : 'Sem preço';

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={st.scrim}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Fechar" />
        <View style={st.sheet}>
          <View style={st.sheetHd}>
            <T bold style={{ fontSize: 20 }}>Editar item</T>
            <IconButton icon="close" label="Fechar" onPress={onClose} />
          </View>
          <View>
            <Label>Apelido</Label>
            <Field value={name} onChangeText={setName} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Label>{isKg ? 'Peso (kg)' : 'Quantidade'}</Label>
              {isKg ? (
                <Field value={kg} onChangeText={setKg} keyboardType="decimal-pad" placeholder="0,000" />
              ) : (
                <View style={st.stepper}>
                  <IconButton icon="minus" label="Diminuir" color={colors.primary} onPress={() => setQty((q) => Math.max(1, q - 1))} />
                  <T bold style={{ fontSize: 20 }}>{qty}</T>
                  <IconButton icon="plus" label="Aumentar" color={colors.primary} onPress={() => setQty((q) => q + 1)} />
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Label>{isKg ? 'Preço por kg' : 'Preço unitário'}</Label>
              <MoneyField value={price} onChangeText={setPrice} />
            </View>
          </View>
          <Kv label="Total do item" value={itemTotal} large />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Remover" icon="trash-can-outline" variant="danger" onPress={onRemove} />
            <Button
              label="Salvar"
              style={{ flex: 1 }}
              onPress={() => onSave(isKg ? { name, unitPrice: unit, kg: parseMoney(kg) } : { name, unitPrice: unit, qty })}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const st = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 20, rowGap: 4 },
  cell: { width: '46%', flexGrow: 1 },
  scrim: { flex: 1, backgroundColor: 'rgba(17,20,24,0.5)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 14 },
  sheetHd: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, minHeight: 52 },
});
