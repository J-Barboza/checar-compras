import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { getFlvPrice, recentFlv } from '../data/db';
import { formatMoney, moneyToInput, parseMoney } from '../domain/money';
import type { ItemMode } from '../domain/purchase';
import { Button, Chip, Field, Footer, Header, Kv, Label, MoneyField, Segmented, T } from '../ui/components';
import { colors } from '../ui/theme';

const shortDate = (ms: number) => new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

export function FlvScreen({ onBack, onAdd }: { onBack: () => void; onAdd: (name: string, mode: ItemMode, price: number | null, amount: number | null) => void }) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<ItemMode>('kg');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const recent = useMemo(() => recentFlv(4), []);
  const last = name.trim() ? getFlvPrice(name) : null;

  const unit = parseMoney(price);
  const amt = parseMoney(amount);
  const value = unit == null ? null : mode === 'kg' ? (amt == null ? null : unit * amt) : unit * (amt ?? 1);

  return (
    <>
      <Header title="Produto sem código (FLV)" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }} keyboardShouldPersistTaps="handled">
        <View>
          <Label>Nome</Label>
          <Field value={name} onChangeText={setName} placeholder="Ex.: Banana prata" autoCapitalize="sentences" />
          {recent.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {recent.map((r) => (
                <Chip key={r.name} small label={r.name} onPress={() => { setName(r.name); setMode(r.mode); }} />
              ))}
            </View>
          )}
        </View>
        <View>
          <Label>Vendido por</Label>
          <Segmented options={[{ key: 'kg', label: 'Quilo (kg)' }, { key: 'un', label: 'Unidade' }]} value={mode} onChange={setMode} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Label>{mode === 'kg' ? 'Preço por kg' : 'Preço unitário'}</Label>
            <MoneyField value={price} onChangeText={setPrice} />
          </View>
          <View style={{ flex: 1 }}>
            <Label>{mode === 'kg' ? 'Peso (kg)' : 'Quantidade'}</Label>
            <Field value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder={mode === 'kg' ? '0,000' : '1'} />
          </View>
        </View>
        {last && (
          <View style={st.lastBox}>
            <T style={{ flex: 1 }}>
              Último preço: <T bold>{formatMoney(last.price)}{last.mode === 'kg' ? '/kg' : ' a unidade'}</T> em {shortDate(last.at)}
            </T>
            <Button label="Usar" variant="secondary" size="sm" onPress={() => { setPrice(moneyToInput(last.price)); setMode(last.mode); }} />
          </View>
        )}
        <Kv label="Valor do item" value={value == null ? 'Sem preço (fica pendente)' : formatMoney(value)} large />
      </ScrollView>
      <Footer>
        <Button label="Adicionar à lista" size="xl" disabled={!name.trim()} onPress={() => onAdd(name.trim(), mode, unit, amt)} />
      </Footer>
    </>
  );
}

const st = StyleSheet.create({
  lastBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primaryTint, borderWidth: 1, borderColor: '#C3D4F7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
});
