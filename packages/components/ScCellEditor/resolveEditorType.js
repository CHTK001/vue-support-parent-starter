/**
 * 根据字段类型和字段名解析编辑器类型
 * @param {string} fieldType - 数据库字段类型（如 VARCHAR, JSON, BLOB）
 * @param {string} fieldName - 字段名
 * @returns {'datetime'|'json'|'hex'|'image'|'url'|'text'}
 */
export const resolveEditorType = (fieldType, fieldName) => {
  const type = (fieldType || '').toUpperCase()
  const name = (fieldName || '').toLowerCase()
  if (/^(date|datetime|timestamp|time)/.test(type)) return 'datetime'
  if (type === 'JSON') return 'json'
  if (/^(blob|binary|varbinary|longblob|mediumblob|tinyblob)/.test(type)) {
    if (/image|img|photo|avatar/.test(name)) return 'image'
    return 'hex'
  }
  if (/url|link|href/.test(name)) return 'url'
  return 'text'
}
