import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { formatMoney, moneyToInput, parseMoney } from '../domain/money';
import { compareWithCashier, pendingCount, purchaseTotal, sortItems, type Item, type Order } from '../domain/purchase';
import { Badge, Button, Footer, Header, IconButton, Kv, Label, MoneyField, Notice, Segmented, T } from '../ui/components';
import { ItemRow } from '../ui/ItemRow';
import { colors } from '../ui/theme';

/** Final check of the purchase in progress; also reviews a receipt later (spec 4.9), with title, cashier total and delete given. */
export function CheckScreen({
  purchase,
  tolerance,
  onBack,
  onToggle,
  onConclude,
  title = 'Conferência',
  initialCashier = null,
  concludeLabel = 'Concluir compra',
  onDelete,
}: {
  purchase: { items: Item[] };
  tolerance: number;
  onBack: () => void;
  onToggle: (id: number) => void;
  onConclude: (cashier: number) => void;
  title?: string;
  initialCashier?: number | null;
  concludeLabel?: string;
  onDelete?: () => void;
}) {
  const [order, setOrder] = useState<Order>('coleta');
  const [cashierText, setCashierText] = useState(() => moneyToInput(initialCashier));
  const items = sortItems(purchase.items, order);
  const checked = purchase.items.filter((i) => i.checked).length;
  const pending = pendingCount(purchase.items);
  const total = purchaseTotal(purchase.items);
  const cashier = parseMoney(cashierText);
  const cmp = cashier == null ? null : compareWithCashier(total, cashier, tolerance);
  const diffText = !cmp ? '' : Math.abs(cmp.diff) < 0.005 ? 'Valores iguais' : cmp.diff > 0 ? `Caixa cobrou ${formatMoney(cmp.diff)} a mais` : `Caixa cobrou ${formatMoney(-cmp.diff)} a menos`;

  return (
    <>
      <Header
        title={title}
        subtitle={`${checked} de ${purchase.items.length} conferidos`}
        onBack={onBack}
        right={onDelete && <IconButton icon="trash-can-outline" label="Excluir compra" color={colors.danger} onPress={onDelete} />}
      />
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <Segmented options={[{ key: 'coleta', label: 'Ordem de coleta' }, { key: 'alfa', label: 'A a Z' }]} value={order} onChange={setOrder} />
            {pending > 0 && (
              <Notice>
                <T>{pending === 1 ? '1 item está sem preço e não entra' : `${pending} itens estão sem preço e não entram`} no total registrado.</T>
              </Notice>
            )}
          </View>
        }
        renderItem={({ item }) => <ItemRow item={item} checkable onPress={() => onToggle(item.id)} />}
      />
      <Footer>
        <Kv label="Total registrado" value={formatMoney(total)} />
        <View>
          <Label>Total do caixa</Label>
          <MoneyField value={cashierText} onChangeText={setCashierText} />
        </View>
        {cmp && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Badge label={cmp.ok ? 'OK' : 'Divergente'} tone={cmp.ok ? 'ok' : 'bad'} />
            <T style={{ flex: 1 }}>{diffText}</T>
          </View>
        )}
        <Button label={concludeLabel} size="xl" disabled={cashier == null} onPress={() => cashier != null && onConclude(cashier)} />
      </Footer>
    </>
  );
}
