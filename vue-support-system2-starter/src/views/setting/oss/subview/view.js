/**
 * md
 */
export function openMarkdown(row, _this) {
    return '#/markdown?url=' + _this.prefix + '&bucket=' + _this.ossBucket + "&id=" + encodeURIComponent(row.id) + "&fromPath=" + (_this.fromPath || '')
}
/**
 * pdf
 */
export function openPdf(row, _this) {
   return '#/pdf?url=' + _this.prefix + '&bucket=' + _this.ossBucket + "&id=" + encodeURIComponent(row.id) + "&fromPath=" +  (_this.fromPath || '')
}
/**
 * openCompress
 */
export function openCompress(row, _this) {
    window.open('/compress?ossId=' + _this.ossId + '&bucket=' + _this.ossBucket + "&id=" + encodeURIComponent(row.id) + "&fromPath=" + row.id, "_blank");
}
/**
 * excel
 */
export function openExcel(row, _this) {
    return '#/excel?url=' + _this.prefix + '&bucket=' + _this.ossBucket + "&id=" + encodeURIComponent(row.id) + "&fromPath=" +  (_this.fromPath || '')
}
/**
 * openTxt
 */
export function openTxt(row, _this) {
   return '#/txt?url=' + _this.prefix + '&bucket=' + _this.ossBucket + '&type=' + row.type+ '&subtype=' + row.subtype + "&id=" + encodeURIComponent(row.id) + "&fromPath=" + (_this.fromPath || '');
}
/**
 * openDocx
 */
export function openDocx(row, _this) {
    return '#/docx?url=' + _this.prefix + '&bucket=' + _this.ossBucket + "&id=" + encodeURIComponent(row.id) + "&fromPath=" +  (_this.fromPath || '')
}
/**
 * html
 */
export function openHtml(row, _this) {
   return '#/html?url=' + _this.prefix + '&bucket=' + _this.ossBucket + "&id=" + encodeURIComponent(row.id) + "&fromPath=" +  (_this.fromPath || '');
}
/**
 * html
 */
export function openPptx(row, _this) {
    return '#/src/plugins/pptx/index.html?url=' + _this.prefix + '&bucket=' + _this.ossBucket + "&id=" + encodeURIComponent(row.id) + "&fromPath=" +  (_this.fromPath || '');
}
/**
 * 打开视图
 */
export function openView(row, _this) {
    if(!_this.fromPath) {
        try {
            _this.fromPath = '';
        }catch(e){}
        
    }
    if(row.subtype === 'markdown') {
        return openMarkdown(row, _this)
    }
    if(row.subtype === 'vnd.openxmlformats-officedocument.presentationml.presentation') {
        return openPptx(row, _this)
    }
    if(row.subtype === 'html') {
        return openHtml(row, _this)
    }
    if(row.subtype === 'pdf') {
        return openPdf(row, _this)
    }
    if(row.subtype === 'vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return openDocx(row, _this)
    }
    if(
        row.type === 'text' 
        || row.subtype === 'x-sql'
        || row.subtype === 'xml'
        || row.subtype === 'json'
    ) {
        return openTxt(row, _this)
    }
    if(row.subtype === 'vnd.ms-excel' 
    || row.subtype === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || row.subtype === 'vnd.ms-excel.sheet.macroenabled.12'
    ) {
        return openExcel(row, _this)
    }
    if(row.subtype === 'zip' ||
    row.subtype === 'x-tar' 
    ) {
        return openCompress(row, _this)
    }
    _this.$message.error('不支持预览');
}