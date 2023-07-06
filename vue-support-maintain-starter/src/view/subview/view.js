/**
 * md
 */
export function openMarkdown(row, _this) {
    const url1 = _this.prefix + '/' + _this.ossBucket + '/' + encodeURIComponent(row.id) 
    layx.open({
        id: url1,
        content: {
            type: 'local-url',
            value: '/markdown?url=' + _this.prefix + '&bucket=' + _this.ossBucket + "&id=" + encodeURIComponent(row.id) + "&fromPath=" + (_this.fromPath || '')
        },
        toolBar: {
            titleBar: {
                title: row.name
            }
        },
        position: 'center',
        width: 800,
        height: 800
    })
}
/**
 * json
 */
export function openJson(row, _this) {
    const url1 = _this.prefix + '/' + _this.ossBucket + '/' + encodeURIComponent(row.id) 
    layx.open({
        id: url1,
        content: {
            type: 'local-url',
            value: '/json?url=' + _this.prefix + '&bucket=' + _this.ossBucket + "&id=" + encodeURIComponent(row.id) + "&fromPath=" +  (_this.fromPath || '')
        },
        toolBar: {
            titleBar: {
                title: row.name
            }
        },
        position: 'center',
        width: 800,
        height: 800
    })
}
/**
 * pdf
 */
export function openPdf(row, _this) {
    const url1 = _this.prefix + '/' + _this.ossBucket + '/' + encodeURIComponent(row.id) 
    layx.open({
        id: url1,
        content: {
            type: 'local-url',
            value: '/pdf?url=' + _this.prefix + '&bucket=' + _this.ossBucket + "&id=" + encodeURIComponent(row.id) + "&fromPath=" +  (_this.fromPath || '')
        },
        toolBar: {
            titleBar: {
                title: row.name
            }
        },
        position: 'center',
        width: 800,
        height: 800
    })
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
    const url1 = _this.prefix + '/' + _this.ossBucket + '/' + encodeURIComponent(row.id) 
    layx.open({
        id: url1,
        content: {
            type: 'local-url',
            value: '/excel?url=' + _this.prefix + '&bucket=' + _this.ossBucket + "&id=" + encodeURIComponent(row.id) + "&fromPath=" +  (_this.fromPath || '')
        },
        toolBar: {
            titleBar: {
                title: row.name
            }
        },
        position: 'center',
        width: 800,
        height: 800
    })
}
/**
 * openTxt
 */
export function openTxt(row, _this) {
    const url1 = _this.prefix + '/' + _this.ossBucket + '/' + encodeURIComponent(row.id) 
    layx.open({
        id: url1,
        content: {
            type: 'local-url',
            value: '/txt?url=' + _this.prefix + '&bucket=' + _this.ossBucket + '&type=' + row.type+ '&subtype=' + row.subtype + "&id=" + encodeURIComponent(row.id) + "&fromPath=" + (_this.fromPath || '')
        },
        toolBar: {
            titleBar: {
                title: row.name
            }
        },
        position: 'center',
        width: 800,
        height: 800
    })
}
/**
 * openDocx
 */
export function openDocx(row, _this) {
    const url1 = _this.prefix + '/' + _this.ossBucket + '/' + encodeURIComponent(row.id)
    layx.open({
        id: url1,
        content: {
            type: 'local-url',
            value: '/docx?url=' + _this.prefix + '&bucket=' + _this.ossBucket + "&id=" + encodeURIComponent(row.id) + "&fromPath=" +  (_this.fromPath || '')
        },
        toolBar: {
            titleBar: {
                title: row.name
            }
        },
        position: 'center',
        width: 800,
        height: 800
    })
}
/**
 * html
 */
export function openHtml(row, _this) {
    const url1 = _this.prefix + '/' + _this.ossBucket + '/' + row.id;
    layx.open({
        id: url1,
        content: {
            type: 'local-url',
            value: '/html?url=' + _this.prefix + '&bucket=' + _this.ossBucket + "&id=" + encodeURIComponent(row.id) + "&fromPath=" +  (_this.fromPath || '')
        },
        toolBar: {
            titleBar: {
                title: row.name
            }
        },
        position: 'center',
        width: 800,
        height: 800
    })
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
        openMarkdown(row, _this)
        return false;
    }
    if(row.subtype === 'html') {
        openHtml(row, _this)
        return false;
    }
    if(row.subtype === 'pdf') {
        openPdf(row, _this)
        return false;
    }
    if(row.subtype === 'vnd.openxmlformats-officedocument.wordprocessingml.document') {
        openDocx(row, _this)
        return false;
    }
    if(
        row.type === 'text' 
        || row.subtype === 'x-sql'
        || row.subtype === 'xml'
        || row.subtype === 'json'
    ) {
        openTxt(row, _this)
        return false;
    }
    if(row.subtype === 'vnd.ms-excel' 
    || row.subtype === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || row.subtype === 'vnd.ms-excel.sheet.macroenabled.12'
    ) {
        openExcel(row, _this)
        return false;
    }
    if(row.subtype === 'zip' 
    ) {
        openCompress(row, _this)
        return false;
    }
    _this.$message.error('不支持预览');
}