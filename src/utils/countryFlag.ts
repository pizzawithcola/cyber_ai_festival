import { COUNTRIES } from '../components/common/Countries';

/**
 * 把 region（2 位国家码或国家全名）转换成旗帜 emoji。
 *
 * null-safe：后端 `region` 对未填写地区的用户会返回 null，
 * 旧实现直接 `.toUpperCase()` 会抛
 * "Cannot read properties of null (reading 'toUpperCase')" 并整页白屏。
 * 未知/非法值统一回退为地球 🌐。
 */
export function countryCodeToFlag(code: string | null | undefined): string {
  if (!code) return '🌐';

  const country = COUNTRIES.find((c) => c.name === code);
  const countryCode = country ? country.code : code;

  // 只转换合法的 2 位字母国家码，其余一律回退
  if (typeof countryCode !== 'string' || !/^[A-Za-z]{2}$/.test(countryCode)) return '🌐';

  return countryCode
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

export default countryCodeToFlag;
