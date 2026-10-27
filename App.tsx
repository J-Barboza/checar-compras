import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold, useFonts } from '@expo-google-fonts/atkinson-hyperlegible';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, KeyboardAvoidingView, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as db from './src/data/db';
import { formatMoney, round2 } from './src/domain/money';
import {
  addBarcodeItem,
  addFlvItem,
  applyBudgetAlert,
  concludePurchase,
  incrementQty,
  newPurchase,
  purchaseTotal,
  receiptResult,
  removeItem,
  toggleChecked,
  updateItem,
  type Item,
  type ItemChanges,
  type ItemMode,
  type Purchase,
  type Receipt,
} from './src/domain/purchase';
import { CheckScreen } from './src/screens/CheckScreen';
import { ConfigScreen } from './src/screens/ConfigScreen';
import { DoneScreen, type PurchaseResult } from './src/screens/DoneScreen';
import { FlvScreen } from './src/screens/FlvScreen';
import { HistoryScreen, receiptDate } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ListScreen } from './src/screens/ListScreen';
import { NewPurchaseScreen } from './src/screens/NewPurchaseScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { Button, T } from './src/ui/components';
import { colors } from './src/ui/theme';

type Screen = 'home' | 'new' | 'list' | 'scan' | 'flv' | 'check' | 'done' | 'config' | 'history' | 'receipt';

// Where the Android back button goes from each screen; home exits the app.
const BACK: Partial<Record<Screen, Screen>> = { new: 'home', list: 'home', scan: 'list', flv: 'list', check: 'list', done: 'home', config: 'home', history: 'home', receipt: 'history' };

db.purgeOld(Date.now());

export default function App() {
  const [fontsLoaded] = useFonts({ AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold });
  const [purchase, setPurchase] = useState<Purchase | null>(() => db.loadPurchase());
  const [screen, setScreen] = useState<Screen>(() => (db.loadPurchase() ? 'list' : 'home'));
  const [tolerance, setTolerance] = useState(() => db.loadTolerance());
  const [result, setResult] = useState<PurchaseResult | null>(null);
  // Receipt open for review, a copy of the saved one.
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [budgetAlert, setBudgetAlert] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const target = BACK[screen];
      if (!target) return false;
      setScreen(target);
      return true;
    });
    return () => sub.remove();
  }, [screen]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  if (!fontsLoaded) return null;

  function showToast(msg: string) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  }

  /** Saves a changed purchase, checks the budget and returns to the list. */
  function commit(next: Purchase, msg?: string) {
    const { purchase: p, alert } = applyBudgetAlert(next);
    setPurchase(p);
    db.savePurchase(p);
    if (alert) setBudgetAlert(true);
    if (msg) showToast(msg);
    setScreen('list');
  }

  function start(market: string, budget: number | null) {
    db.rememberMarket(market);
    const p = newPurchase(market, budget, Date.now());
    setPurchase(p);
    db.savePurchase(p);
    setScreen('list');
  }

  function addScanned(code: string, name: string, price: number | null) {
    if (!purchase) return;
    db.saveProduct(code, name, price, Date.now());
    commit(addBarcodeItem(purchase, code, name, price), price == null ? `${name} ficou sem preço` : `${name} registrado`);
  }

  function repeat(item: Item) {
    if (!purchase) return;
    commit(incrementQty(purchase, item.id), `${item.name}: agora ${item.qty + 1} unidades`);
  }

  function addFlv(name: string, mode: ItemMode, price: number | null, amount: number | null) {
    if (!purchase) return;
    if (price != null) db.saveFlvPrice(name, mode, price, Date.now());
    commit(addFlvItem(purchase, name, mode, price, amount), price == null ? `${name} ficou sem preço` : `${name} registrado`);
  }

  function update(id: number, changes: ItemChanges) {
    if (!purchase) return;
    commit(updateItem(purchase, id, changes), 'Item atualizado');
  }

  function remove(id: number) {
    if (!purchase) return;
    const it = purchase.items.find((i) => i.id === id);
    commit(removeItem(purchase, id), it ? `${it.name} removido` : undefined);
  }

  function toggle(id: number) {
    if (!purchase) return;
    const p = toggleChecked(purchase, id);
    setPurchase(p);
    db.savePurchase(p);
  }

  function conclude(cashier: number) {
    if (!purchase) return;
    const r = db.saveReceipt(concludePurchase(purchase, cashier, tolerance, Date.now()));
    const res = receiptResult(r);
    setResult({ ok: res.ok, market: r.market, at: r.at, total: res.total, cashier, diff: res.diff, tolerance });
    // The purchase in progress goes away; its items stay only in the receipt (spec 4.9 and 4.10).
    db.clearPurchase();
    setPurchase(null);
    setScreen('done');
  }

  function toggleInReceipt(id: number) {
    if (!receipt) return;
    const r = toggleChecked(receipt, id);
    setReceipt(r);
    db.updateReceipt(r);
  }

  function saveReview(cashier: number) {
    if (!receipt) return;
    db.updateReceipt({ ...receipt, cashier });
    showToast('Revisão salva');
    setScreen('history');
  }

  function deleteReceipt() {
    if (!receipt) return;
    Alert.alert('Excluir esta compra?', 'Os itens e preços dela serão apagados do aparelho.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          db.deleteReceipt(receipt.id);
          showToast('Compra excluída');
          setScreen('history');
        },
      },
    ]);
  }

  function changeTolerance(v: number) {
    const t = round2(v);
    setTolerance(t);
    db.saveTolerance(t);
  }

  const dark = screen === 'scan';
  const total = purchase ? purchaseTotal(purchase.items) : 0;

  return (
    <SafeAreaProvider>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <SafeAreaView style={[st.root, { backgroundColor: dark ? colors.camera : colors.bg }]} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          {screen === 'home' && (
            <HomeScreen
              purchase={purchase}
              tolerance={tolerance}
              receiptCount={db.loadReceipts().length}
              onNew={() => setScreen('new')}
              onContinue={() => setScreen('list')}
              onHistory={() => setScreen('history')}
              onConfig={() => setScreen('config')}
            />
          )}
          {screen === 'history' && <HistoryScreen receipts={db.loadReceipts()} onBack={() => setScreen('home')} onOpen={(r) => { setReceipt(r); setScreen('receipt'); }} />}
          {receipt && screen === 'receipt' && (
            <CheckScreen
              key={receipt.id}
              purchase={receipt}
              tolerance={receipt.tolerance}
              title={`${receipt.market} · ${receiptDate(receipt.at)}`}
              initialCashier={receipt.cashier}
              concludeLabel="Salvar revisão"
              onBack={() => setScreen('history')}
              onToggle={toggleInReceipt}
              onConclude={saveReview}
              onDelete={deleteReceipt}
            />
          )}
          {screen === 'new' && <NewPurchaseScreen markets={db.loadMarkets()} onBack={() => setScreen('home')} onStart={start} />}
          {screen === 'config' && <ConfigScreen tolerance={tolerance} onChange={changeTolerance} onBack={() => setScreen('home')} />}
          {screen === 'done' && result && <DoneScreen result={result} onHome={() => setScreen('home')} />}
          {purchase && screen === 'list' && (
            <ListScreen purchase={purchase} onHome={() => setScreen('home')} onCheck={() => setScreen('check')} onScan={() => setScreen('scan')} onFlv={() => setScreen('flv')} onUpdate={update} onRemove={remove} />
          )}
          {purchase && screen === 'scan' && <ScanScreen purchase={purchase} onRepeat={repeat} onAdd={addScanned} onCancel={() => setScreen('list')} />}
          {purchase && screen === 'flv' && <FlvScreen onBack={() => setScreen('list')} onAdd={addFlv} />}
          {purchase && screen === 'check' && <CheckScreen purchase={purchase} tolerance={tolerance} onBack={() => setScreen('list')} onToggle={toggle} onConclude={conclude} />}
        </KeyboardAvoidingView>

        {toast ? (
          <View style={st.toast} pointerEvents="none" accessibilityLiveRegion="polite">
            <T style={{ color: '#fff', textAlign: 'center', fontSize: 16 }}>{toast}</T>
          </View>
        ) : null}
      </SafeAreaView>

      <Modal transparent visible={budgetAlert} animationType="fade" onRequestClose={() => setBudgetAlert(false)}>
        <View style={st.scrim}>
          <View style={st.dialog} accessibilityRole="alert">
            <View style={st.warnIco}>
              <MaterialCommunityIcons name="alert-outline" size={30} color={colors.warn} />
            </View>
            <T bold style={{ fontSize: 22 }}>Seu orçamento chegou</T>
            <T>
              Total registrado <T bold>{formatMoney(total)}</T>, orçamento <T bold>{formatMoney(purchase?.budget ?? 0)}</T>.
            </T>
            <T muted>Se precisar, toque num item da lista para diminuir a quantidade ou remover.</T>
            <Button label="Entendi" size="xl" style={{ alignSelf: 'stretch' }} onPress={() => setBudgetAlert(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  toast: { position: 'absolute', left: 16, right: 16, bottom: 240, backgroundColor: colors.ink, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  scrim: { flex: 1, backgroundColor: 'rgba(17,20,24,0.5)', justifyContent: 'center', padding: 20 },
  dialog: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 10, alignItems: 'flex-start' },
  warnIco: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.warnSoft, alignItems: 'center', justifyContent: 'center' },
});
