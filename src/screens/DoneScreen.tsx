import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, View } from 'react-native';
import { formatMoney } from '../domain/money';
import { Button, Footer, Kv, T } from '../ui/components';
import { colors } from '../ui/theme';

export interface PurchaseResult {
  ok: boolean;
  market: string;
  at: number;
  total: number;
  cashier: number;
  diff: number;
  tolerance: number;
}

export function DoneScreen({ result, onHome }: { result: PurchaseResult; onHome: () => void }) {
  const date = new Date(result.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, alignItems: 'center' }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, marginTop: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: result.ok ? colors.primarySoft : colors.dangerSoft }}>
          <MaterialCommunityIcons name={result.ok ? 'check-bold' : 'alert-outline'} size={48} color={result.ok ? colors.primary : colors.danger} />
        </View>
        <T bold style={{ fontSize: 28 }}>{result.ok ? 'Compra OK' : 'Compra divergente'}</T>
        <T muted>{result.market} · {date}</T>
        <View style={{ alignSelf: 'stretch', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16, gap: 8 }}>
          <Kv label="Total registrado" value={formatMoney(result.total)} />
          <Kv label="Total do caixa" value={formatMoney(result.cashier)} />
          <Kv label="Diferença" value={formatMoney(Math.abs(result.diff))} />
          <Kv label="Tolerância" value={formatMoney(result.tolerance)} />
        </View>
        <T muted style={{ textAlign: 'center' }}>Os itens desta compra foram apagados do aparelho.</T>
      </ScrollView>
      <Footer>
        <Button label="Voltar ao início" size="xl" onPress={onHome} />
      </Footer>
    </>
  );
}
