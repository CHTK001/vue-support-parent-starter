/**
 * 获取本地图
 * @param name // 文件名 如 doc.png
 * @returns {*|string}
 */
export function getAssetsImages(name) {
  if (name) {
    name = name.toLowerCase();
  }
  if (name.indexOf(".") == -1) {
    name = name + ".png";
  }
  const url = new URL(`/src/assets/images/${name}`, import.meta.url).href;
  if (url && !url.endsWith("undefined")) {
    return url;
  }

  return new URL(`/src/assets/images/unknown.png`, import.meta.url).href;
}

/**
 * 文件url类型
 */
export function getUrlType(url) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      // Wait for header to become available.
      var contentType = xhr.getResponseHeader("Content-Type");
      if (contentType) {
        resolve(contentType);
        xhr.abort();
      } else {
        reject();
      }
    };
    xhr.send();
  });
}
