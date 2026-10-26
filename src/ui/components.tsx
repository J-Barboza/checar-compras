import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { colors, fonts, TOUCH } from './theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function T({ children, style, bold, muted, numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; bold?: boolean; muted?: boolean; numberOfLines?: number }) {
  return (
    <Text numberOfLines={numberOfLines} style={[s.text, bold && s.bold, muted && s.muted, style]}>
      {children}
    </Text>
  );
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'sm' | 'md' | 'xl';
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = disabled ? s.btnDisabled : s[variant];
  const fg = disabled ? colors.muted : variant === 'primary' ? '#fff' : variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.primary : colors.ink;
  const height = size === 'xl' ? 64 : size === 'sm' ? 44 : 52;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.btn, { minHeight: height }, v, pressed && !disabled && s.pressed, style]}
    >
      {icon && <MaterialCommunityIcons name={icon} size={size === 'xl' ? 26 : 22} color={fg} />}
      <Text style={[s.btnText, { color: fg, fontSize: size === 'xl' ? 20 : size === 'sm' ? 16 : 18 }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, color = colors.ink }: { icon: IconName; label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4} style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}>
      <MaterialCommunityIcons name={icon} size={26} color={color} />
    </Pressable>
  );
}

export function Header({ title, subtitle, onBack, backIcon = 'chevron-left', right }: { title: string; subtitle?: string; onBack?: () => void; backIcon?: IconName; right?: ReactNode }) {
  return (
    <View style={s.header}>
      {onBack ? <IconButton icon={backIcon} label={backIcon === 'home-outline' ? 'Início' : 'Voltar'} onPress={onBack} /> : <View style={{ width: 8 }} />}
      <View style={{ flex: 1 }}>
        <T bold style={s.headerTitle} numberOfLines={1}>
          {title}
        </T>
        {subtitle ? <T muted style={{ fontSize: 14 }}>{subtitle}</T> : null}
      </View>
      {right}
    </View>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <T bold style={s.label}>{children}</T>;
}

export function Field(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.muted} {...props} style={[s.field, props.style]} />;
}

export function MoneyField({ large, ...props }: TextInputProps & { large?: boolean }) {
  return (
    <View style={s.money}>
      <T bold muted>R$</T>
      <TextInput
        keyboardType="decimal-pad"
        placeholder="0,00"
        placeholderTextColor={colors.muted}
        {...props}
        onChangeText={(t) => props.onChangeText?.(t.replace(/([.,]\d{2})\d+$/, '$1'))}
        style={[s.moneyInput, large && s.moneyLarge, props.style]}
      />
    </View>
  );
}

export function Segmented<K extends string>({ options, value, onChange }: { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  return (
    <View style={s.seg} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => onChange(o.key)} style={[s.segBtn, on && s.segOn]}>
            <T bold style={{ color: on ? colors.ink : colors.muted }}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, on, onPress, small }: { label: string; on?: boolean; onPress: () => void; small?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!on }} onPress={onPress} style={[s.chip, small && s.chipSmall, on && s.chipOn]}>
      <T bold={on} style={{ fontSize: small ? 16 : 17, textAlign: 'center' }}>{label}</T>
    </Pressable>
  );
}

export function Kv({ label, value, color, large }: { label: string; value: string; color?: string; large?: boolean }) {
  return (
    <View style={[s.kv, large && s.kvLarge]}>
      <T muted={!color} style={[{ fontSize: large ? 18 : 16 }, color ? { color } : null]}>{label}</T>
      <T bold style={[{ fontSize: large ? 18 : 16, fontVariant: ['tabular-nums'] }, color ? { color } : null]}>{value}</T>
    </View>
  );
}

export function Notice({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <View style={s.notice} accessibilityRole="alert">
      {title ? <T bold>{title}</T> : null}
      {children}
    </View>
  );
}

export function Badge({ label, tone }: { label: string; tone: 'warn' | 'ok' | 'bad' }) {
  const bg = tone === 'warn' ? colors.warn : tone === 'ok' ? colors.primarySoft : colors.dangerSoft;
  const fg = tone === 'warn' ? '#fff' : tone === 'ok' ? colors.primary : colors.danger;
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <T bold style={{ color: fg, fontSize: 14 }}>{label}</T>
    </View>
  );
}

export function Footer({ children }: { children: ReactNode }) {
  return <View style={s.footer}>{children}</View>;
}

export const s = StyleSheet.create({
  text: { fontFamily: fonts.regular, fontSize: 17, color: colors.ink },
  bold: { fontFamily: fonts.bold },
  muted: { color: colors.muted },
  pressed: { opacity: 0.75 },
  btn: { borderRadius: 14, borderWidth: 2, borderColor: 'transparent', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontFamily: fonts.bold },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderColor: colors.primary },
  ghost: { backgroundColor: colors.surface, borderColor: colors.border },
  danger: { backgroundColor: colors.surface, borderColor: colors.danger },
  btnDisabled: { backgroundColor: colors.disabled },
  iconBtn: { width: TOUCH, height: TOUCH, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingLeft: 4, paddingRight: 12, minHeight: 64, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line },
  headerTitle: { fontSize: 20 },
  label: { fontSize: 15, marginBottom: 6 },
  field: { minHeight: 52, borderWidth: 2, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, fontSize: 18, backgroundColor: colors.surface, color: colors.ink, fontFamily: fonts.regular },
  money: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, paddingLeft: 14 },
  moneyInput: { flex: 1, minHeight: 48, fontSize: 18, paddingHorizontal: 10, color: colors.ink, fontFamily: fonts.regular },
  moneyLarge: { fontSize: 28, minHeight: 60, fontFamily: fonts.bold },
  seg: { flexDirection: 'row', backgroundColor: '#E9E7E0', borderRadius: 12, padding: 4, gap: 4 },
  segBtn: { flex: 1, minHeight: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.surface, elevation: 1 },
  chip: { minHeight: 52, borderRadius: 12, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  chipSmall: { minHeight: 44 },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  kvLarge: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line },
  notice: { backgroundColor: colors.warnSoft, borderWidth: 2, borderColor: colors.warnBorder, borderRadius: 14, padding: 14, gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  footer: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 10 },
});
