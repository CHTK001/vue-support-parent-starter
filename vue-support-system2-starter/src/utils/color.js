
export const indexedColors = [
    '000000',
    'FFFFFF',
    'FF0000',
    '00FF00',
    '0000FF',
    'FFFF00',
    'FF00FF',
    '00FFFF',
    '000000',
    'FFFFFF',
    'FF0000',
    '00FF00',
    '0000FF',
    'FFFF00',
    'FF00FF',
    '00FFFF',
    '800000',
    '008000',
    '000080',
    '808000',
    '800080',
    '008080',
    'C0C0C0',
    '808080',
    '9999FF',
    '993366',
    'FFFFCC',
    'CCFFFF',
    '660066',
    'FF8080',
    '0066CC',
    'CCCCFF',
    '000080',
    'FF00FF',
    'FFFF00',
    '00FFFF',
    '800080',
    '800000',
    '008080',
    '0000FF',
    '00CCFF',
    'CCFFFF',
    'CCFFCC',
    'FFFF99',
    '99CCFF',
    'FF99CC',
    'CC99FF',
    'FFCC99',
    '3366FF',
    '33CCCC',
    '99CC00',
    'FFCC00',
    'FF9900',
    'FF6600',
    '666699',
    '969696',
    '003366',
    '339966',
    '003300',
    '333300',
    '993300',
    '993366',
    '333399',
    '333333',
    'b7e0ff',
    '00CCFF'
  ];

export default {
	//hex颜色转rgb颜色
	HexToRgb(str) {
		str = str.replace("#", "")
		var hxs = str.match(/../g)
		for (var i = 0; i < 3; i++) hxs[i] = parseInt(hxs[i], 16)
		return hxs
	},
	//rgb颜色转hex颜色
	RgbToHex(a, b, c) {
		var hexs = [a.toString(16), b.toString(16), c.toString(16)]
		for (var i = 0; i < 3; i++) {
			if (hexs[i].length == 1) hexs[i] = "0" + hexs[i]
		}
		return "#" + hexs.join("");
	},
	//加深
	darken(color, level) {
		var rgbc = this.HexToRgb(color)
		for (var i = 0; i < 3; i++) rgbc[i] = Math.floor(rgbc[i] * (1 - level))
		return this.RgbToHex(rgbc[0], rgbc[1], rgbc[2])
	},
	//变淡
	lighten(color, level) {
		var rgbc = this.HexToRgb(color)
		for (var i = 0; i < 3; i++) rgbc[i] = Math.floor((255 - rgbc[i]) * level + rgbc[i])
		return this.RgbToHex(rgbc[0], rgbc[1], rgbc[2])
	}
}
