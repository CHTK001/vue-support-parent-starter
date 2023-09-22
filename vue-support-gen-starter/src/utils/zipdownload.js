import axios from "axios"

const mimeMap = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip'
}

export function downLoadZip(str, data, filename) {
  var url = str
  axios({
    method: 'get',
    url: url,
    params: data,
    responseType: 'blob',
  }).then((res) => {
    resolveBlob(res, mimeMap.zip, filename)
  })
}

/**
 * 解析blob响应内容并下载
 * @param {*} res blob响应内容
 * @param {String} mimeType MIME类型
 */
export function resolveBlob(res, mimeType, name) {
  const aLink = document.createElement('a')
  var blob = new Blob([res.data], { type: mimeType })
  // //从response的headers中获取filename, 后端response.setHeader("Content-disposition", "attachment; filename=xxxx.docx") 设置的文件名;
  var patt = new RegExp('filename=([^;]+\\.[^\\.;]+);*')
  const disp = res.headers['content-disposition'];
  var fileName = name;
  if(disp) {
    var contentDisposition = decodeURI(disp)
    var result = patt.exec(contentDisposition)
    fileName = result[1]
  }

  var 
  fileName = fileName.replace(/\"/g, '')
  aLink.href = URL.createObjectURL(blob)
  aLink.setAttribute('download', fileName) // 设置下载文件名称
  document.body.appendChild(aLink)
  aLink.click()
  document.body.removeChild(aLink)
}
