import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { parseMoney } from '../domain/money';
import { Button, Chip, Field, Footer, Header, Label, MoneyField, T } from '../ui/components';

export function NewPurchaseScreen({ markets, onBack, onStart }: { markets: string[]; onBack: () => void; onStart: (market: string, budget: number | null) => void }) {
  const [picked, setPicked] = useState(markets[0] ?? '');
  const [other, setOther] = useState('');
  const [budget, setBudget] = useState('');
  const market = other.trim() || picked;

  return (
    <>
      <Header title="Nova compra" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }} keyboardShouldPersistTaps="handled">
        <View>
          <Label>Em qual supermercado?</Label>
          {markets.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {markets.map((m) => (
                <View key={m} style={{ width: '48.5%' }}>
                  <Chip label={m} on={!other.trim() && picked === m} onPress={() => { setPicked(m); setOther(''); }} />
                </View>
              ))}
            </View>
          )}
          <Label>{markets.length > 0 ? 'Outro mercado' : 'Nome do mercado'}</Label>
          <Field placeholder="Digite o nome" value={other} onChangeText={setOther} autoCapitalize="words" />
        </View>
        <View>
          <Label>Orçamento (opcional)</Label>
          <MoneyField value={budget} onChangeText={setBudget} />
          <T muted style={{ fontSize: 15, marginTop: 6 }}>Avisamos quando o total registrado chegar nesse valor.</T>
        </View>
      </ScrollView>
      <Footer>
        <Button label="Começar a compra" size="xl" disabled={!market} onPress={() => onStart(market, parseMoney(budget))} />
      </Footer>
    </>
  );
}
