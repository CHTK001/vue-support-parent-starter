var fo = document.querySelectorAll("foreignObject");
var out = [];
for (var i = 0; i < fo.length; i++) {
  var body = fo[i].querySelector("body");
  if (body) {
    var div = body.firstElementChild;
    var st = div ? getComputedStyle(div) : null;
    var bg = st ? st.background.substring(0, 50) : "?";
    var txt = body.textContent.substring(0, 30).replace(/\n/g, "/");
    out.push("n" + i + " bg=" + bg + " txt=" + txt);
  }
}
out.length ? out.join(" || ") : "NO NODES";
