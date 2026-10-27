import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { getProduct, type Product } from '../data/db';
import { readPricesFromPhoto } from '../data/labelOcr';
import { suggestName } from '../data/openFoodFacts';
import { formatMoney, moneyToInput, parseMoney } from '../domain/money';
import { findByCode, type Item, type Purchase } from '../domain/purchase';
import { Button, Field, Label, MoneyField, T } from '../ui/components';
import { colors } from '../ui/theme';

type Step = 'code' | 'typeCode' | 'name' | 'price' | 'photo';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'itf14'] as const;
const shortDate = (ms: number) => new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

/**
 * Capture flow: read barcode → (new product: nickname) → price → back to the list.
 * A code already in the purchase only adds one to its quantity.
 */
export function ScanScreen({
  purchase,
  onRepeat,
  onAdd,
  onCancel,
}: {
  purchase: Purchase;
  onRepeat: (item: Item) => void;
  onAdd: (code: string, name: string, price: number | null) => void;
  onCancel: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [typedCode, setTypedCode] = useState('');
  const [name, setName] = useState('');
  const [known, setKnown] = useState<Product | null>(null);
  const [suggestion, setSuggestion] = useState<string | null | 'loading'>(null);
  const [price, setPrice] = useState('');
  const [reading, setReading] = useState(false);
  const [ocrFailed, setOcrFailed] = useState(false);
  // Every big price on the last label photo, so the user can switch to another one.
  const [photoPrices, setPhotoPrices] = useState<number[]>([]);
  // onBarcodeScanned fires many times per second; this keeps only the first read.
  const locked = useRef(false);
  const camera = useRef<CameraView>(null);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  function handleCode(raw: string) {
    const c = raw.trim();
    if (!c) return;
    const existing = findByCode(purchase, c);
    if (existing) return onRepeat(existing);
    setCode(c);
    const product = getProduct(c);
    if (product) {
      setKnown(product);
      setName(product.nickname);
      setStep('price');
      return;
    }
    setStep('name');
    setSuggestion('loading');
    suggestName(c).then(setSuggestion);
  }

  function onScanned(result: BarcodeScanningResult) {
    if (locked.current) return;
    locked.current = true;
    handleCode(result.data);
  }

  // The recognized value only fills the field; the user still confirms with "Salvar preço".
  async function takeLabelPhoto() {
    if (!camera.current || reading) return;
    setReading(true);
    let values: number[] = [];
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.7, shutterSound: false });
      values = await readPricesFromPhoto(photo.uri);
    } catch {}
    setReading(false);
    setOcrFailed(values.length === 0);
    setPhotoPrices(values);
    if (values.length) setPrice(moneyToInput(values[0]));
    setStep('price');
  }

  if (step === 'photo') {
    return (
      <View style={st.dark}>
        <View style={st.camWrap}>
          {permission?.granted ? (
            <>
              <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" />
              <View style={st.labelFinder} pointerEvents="none" />
            </>
          ) : (
            <View style={{ padding: 24, gap: 12, alignItems: 'center' }}>
              <T style={{ color: colors.onCamera, textAlign: 'center' }}>O app precisa da câmera para ler o preço da etiqueta.</T>
              <Button label="Permitir câmera" onPress={requestPermission} />
            </View>
          )}
        </View>
        <View style={st.panel}>
          <T bold style={{ fontSize: 20 }}>Enquadre o preço da etiqueta</T>
          <T muted>Em etiquetas "de/por", enquadre o valor do "por".</T>
          <Button label={reading ? 'Lendo o preço…' : 'Fotografar'} size="xl" icon="camera" disabled={reading || !permission?.granted} onPress={takeLabelPhoto} />
          <Button label="Voltar e digitar" variant="ghost" disabled={reading} onPress={() => setStep('price')} />
        </View>
      </View>
    );
  }

  if (step === 'code') {
    return (
      <View style={st.dark}>
        <View style={st.camWrap}>
          {permission?.granted ? (
            <>
              <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }} onBarcodeScanned={onScanned} />
              <View style={st.finder} pointerEvents="none">
                <View style={st.laser} />
              </View>
            </>
          ) : (
            <View style={{ padding: 24, gap: 12, alignItems: 'center' }}>
              <T style={{ color: colors.onCamera, textAlign: 'center' }}>O app precisa da câmera para ler o código de barras.</T>
              <Button label="Permitir câmera" onPress={requestPermission} />
            </View>
          )}
        </View>
        <View style={st.panel}>
          <T bold style={{ fontSize: 20 }}>Aponte para o código de barras</T>
          <T muted>O item entra na lista assim que o código for lido.</T>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Digitar código" variant="ghost" style={{ flex: 1 }} onPress={() => setStep('typeCode')} />
            <Button label="Cancelar" variant="ghost" style={{ flex: 1 }} onPress={onCancel} />
          </View>
        </View>
      </View>
    );
  }

  if (step === 'typeCode') {
    return (
      <View style={st.dark}>
        <View style={st.topInfo}>
          <MaterialCommunityIcons name="barcode" size={40} color={colors.onCamera} />
        </View>
        <View style={[st.panel, st.panelFill]}>
          <View>
            <Label>Código de barras</Label>
            <Field value={typedCode} onChangeText={(t) => setTypedCode(t.replace(/\D/g, ''))} keyboardType="number-pad" autoFocus placeholder="Números abaixo das barras" />
          </View>
          <Button label="Continuar" size="xl" disabled={typedCode.length < 6} onPress={() => handleCode(typedCode)} />
          <Button label="Cancelar" variant="ghost" onPress={onCancel} />
        </View>
      </View>
    );
  }

  if (step === 'name') {
    return (
      <View style={st.dark}>
        <View style={st.topInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="check-bold" size={22} color={colors.readOk} />
            <T bold style={{ color: colors.readOk, fontSize: 18 }}>Código lido</T>
          </View>
          <T style={{ color: '#C9CDD6', fontSize: 15, letterSpacing: 1 }}>{code}</T>
        </View>
        <View style={[st.panel, st.panelFill]}>
          <T bold style={{ fontSize: 20 }}>Produto novo</T>
          {suggestion === 'loading' && <T muted>Buscando sugestão de nome…</T>}
          {suggestion && suggestion !== 'loading' && (
            <Pressable accessibilityRole="button" onPress={() => setName(suggestion)} style={st.suggest}>
              <T>
                <T muted>Sugestão: </T>
                {suggestion}
              </T>
            </Pressable>
          )}
          <View>
            <Label>Apelido curto</Label>
            <Field value={name} onChangeText={setName} autoFocus placeholder="Ex.: Café Pilão" autoCapitalize="sentences" returnKeyType="next" onSubmitEditing={() => name.trim() && setStep('price')} />
          </View>
          <Button label="Continuar para o preço" disabled={!name.trim()} onPress={() => setStep('price')} />
        </View>
      </View>
    );
  }

  const value = parseMoney(price);
  return (
    <View style={st.dark}>
      <View style={st.topInfo}>
        <T bold style={{ color: '#fff', fontSize: 20, textAlign: 'center' }} numberOfLines={2}>{name}</T>
        <T style={{ color: '#C9CDD6', fontSize: 15 }}>{known ? 'Produto já cadastrado' : `Produto novo · ${code}`}</T>
      </View>
      <View style={[st.panel, st.panelFill]}>
        {known?.lastPrice != null && known.lastPriceAt != null && (
          <Pressable accessibilityRole="button" onPress={() => setPrice(moneyToInput(known.lastPrice))} style={st.suggest}>
            <T>
              Último preço: <T bold>{formatMoney(known.lastPrice)}</T> em {shortDate(known.lastPriceAt)} · <T bold style={{ color: colors.primary }}>Usar</T>
            </T>
          </Pressable>
        )}
        <View>
          <Label>Preço na etiqueta</Label>
          <MoneyField large value={price} onChangeText={setPrice} autoFocus />
        </View>
        {photoPrices.filter((p) => p !== value).map((p) => (
          <Pressable key={p} accessibilityRole="button" onPress={() => setPrice(moneyToInput(p))} style={st.suggest}>
            <T>
              Outro preço na foto: <T bold>{formatMoney(p)}</T> · <T bold style={{ color: colors.primary }}>Usar</T>
            </T>
          </Pressable>
        ))}
        {ocrFailed && <T style={{ color: colors.warn }}>Não encontrei o preço na foto. Tente de novo ou digite o valor.</T>}
        <Button label="Fotografar etiqueta" variant="secondary" icon="camera" onPress={() => { setOcrFailed(false); setStep('photo'); }} />
        <Button label="Salvar preço" size="xl" disabled={value == null} onPress={() => onAdd(code, name.trim(), value)} />
        <Button label="Deixar sem preço" variant="ghost" onPress={() => onAdd(code, name.trim(), null)} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  dark: { flex: 1, backgroundColor: colors.camera },
  camWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  finder: { width: 270, height: 130, borderWidth: 3, borderColor: '#fff', borderRadius: 16, justifyContent: 'center' },
  laser: { height: 2, marginHorizontal: 14, backgroundColor: '#FF6B5F' },
  labelFinder: { width: 280, height: 160, borderWidth: 3, borderColor: '#fff', borderRadius: 16 },
  topInfo: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16 },
  panel: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16, gap: 12 },
  // Pushes the inputs to the bottom, right above the keyboard.
  panelFill: { flex: 1, justifyContent: 'flex-end' },
  suggest: { minHeight: 48, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: colors.primaryTint, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center' },
});
