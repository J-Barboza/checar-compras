import { useState } from 'react';
import { View } from 'react-native';
import { moneyToInput, parseMoney } from '../domain/money';
import { Header, Label, MoneyField, T } from '../ui/components';

export function ConfigScreen({ tolerance, onChange, onBack }: { tolerance: number; onChange: (v: number) => void; onBack: () => void }) {
  const [text, setText] = useState(moneyToInput(tolerance));
  return (
    <>
      <Header title="Configurações" onBack={onBack} />
      <View style={{ padding: 16 }}>
        <Label>Tolerância</Label>
        <MoneyField
          value={text}
          onChangeText={(t) => {
            setText(t);
            const v = parseMoney(t);
            if (v != null) onChange(v);
          }}
        />
        <T muted style={{ fontSize: 15, marginTop: 6 }}>Diferenças até esse valor entre o total registrado e o caixa contam como OK.</T>
      </View>
    </>
  );
}
