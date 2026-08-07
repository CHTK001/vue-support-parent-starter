/** ReRemoteSelect 选项类型 */
export interface ReRemoteOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  description?: string;
  [k: string]: unknown;
}