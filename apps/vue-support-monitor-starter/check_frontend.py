import urllib.request
try:
    r = urllib.request.urlopen('http://127.0.0.1:8848/', timeout=3)
    print('前端运行中, status:', r.status)
except Exception as e:
    print('前端未运行:', e)
