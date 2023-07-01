/**
 * 引入本地图片
 * 当引入时，打包dist成功，运行dist会有问题，暂时不用，待修正
 */
const picture = import.meta.globEager('../assets/images/*');
const imgList = Object.keys(picture).filter(item => true).map(item => {
  const url = picture[item]?.default;
  const name_suffix = url.substring(url.lastIndexOf('/') + 1, url.length);
  const name = name_suffix.substring(0, name_suffix.indexOf('.'));
  return {
    url,
    name_suffix,
    name,
  };
});

export default imgList;
