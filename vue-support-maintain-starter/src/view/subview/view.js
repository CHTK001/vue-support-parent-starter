/**
 * md
 */
export function openMarkdown(row, _this) {
    const url1 = _this.prefix + '/' + _this.base.ossBucket + '/' + encodeURIComponent(row.id);
    layx.open({
        id: url1,
        content: {
            type: 'local-url',
            value: '/markdown?url=' + _this.prefix + '&bucket=' + _this.base.ossBucket + "&id=" + encodeURIComponent(row.id)
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
 * md
 */
export function openJson(row, _this) {
    const url1 = _this.prefix + '/' + _this.base.ossBucket + '/' + encodeURIComponent(row.id);
    layx.open({
        id: url1,
        content: {
            type: 'local-url',
            value: '/json?url=' + _this.prefix + '&bucket=' + _this.base.ossBucket + "&id=" + encodeURIComponent(row.id)
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
    if(row.subtype === 'markdown') {
        openMarkdown(row, _this)
        return false;
    }
    if(row.subtype === 'json') {
        openJson(row, _this)
        return false;
    }
    if(row.subtype === 'json') {
        openJson(row, _this)
        return false;
    }
    _this.$message.error('不支持预览');
}