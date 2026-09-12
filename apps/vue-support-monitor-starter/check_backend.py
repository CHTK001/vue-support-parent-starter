import urllib.request
try:
    r = urllib.request.urlopen('http://127.0.0.1:8081/ms/monitor/config', timeout=3)
    print('后端服务运行中, status:', r.status)
except Exception as e:
    print('后端服务未运行:', e)
