export function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 文件url类型
 */
export function getUrlType(url){
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            // Wait for header to become available.
            var contentType = xhr.getResponseHeader('Content-Type');
            if (contentType) {
                resolve(contentType)
                xhr.abort();
            } else {
                reject();
            }
        };
        xhr.send();
    })
}

  /**
   * 获取本地图
   * @param name // 文件名 如 doc.png
   * @returns {*|string}
   */
  export  function getAssetsImages(name) {
    if(name) {
        name = name.toLowerCase();
    }
    if(name.indexOf(".") == -1) {
        name = name + '.png';
    }
    const url = new URL(`/src/assets/images/${name}`, import.meta.url).href;
    if(url && !url.endsWith("undefined")) {
        return url;
    }

    return new URL(`/src/assets/images/unknown.png`, import.meta.url).href;
  }
/**
* @desc 获取url参数
* @param {String} name  想要获取的参数名字
*/
export function getQueryPathString(path, name){
    var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
    var r = path.match(reg);
    if(r!=null)return  unescape(r[2]); return null;
}
/**
* @desc 获取url参数
* @param {String} name  想要获取的参数名字
*/
export function getQueryString(name){
    var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
    var r = ((
        window.location.hash && window.location.hash.indexOf('?')>-1 ? 
            window.location.hash.substring(window.location.hash.indexOf('?')) :
        ""

    ) || window.location.search).substr(1).match(reg);
    if(r!=null)return  unescape(decodeURIComponent(r[2])); return null;
}

export function isNewSame(item, arr) {
    for (const objElement of Object.keys(item)) {
        if (arr[objElement] !== item[objElement]) {
            return !1;
        }
    }
    return !0;
}

export function copy(obj) {
    const rs = {};
    for (const objElement of Object.keys(obj)) {
        rs[objElement] = obj[objElement];
    }

    return rs;
}

export function sformat(url, ...param) {
    let newUrl = url;
    if(param.length == 1) {
        param = param[0];
        if(param instanceof Array) {
            if(param.length == 0) {
                param = {};
            } else {
                param = param[0];
            }
        }
        for (let key of Object.keys(param)) {
            newUrl = newUrl.replace("{" + key + "}", param[key]);
        }
    } else {
        for (const paramElement of param) {
            for (let key of Object.keys(paramElement)) {
                newUrl = newUrl.replace("{" + key + "}", paramElement[key]);
            }
        }
    }


    return newUrl;
}