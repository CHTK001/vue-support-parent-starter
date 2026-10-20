import paramiko
c = paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("192.168.50.198", username="kali", password="kali", timeout=25)
def sh(cmd, t=120):
    i,o,e = c.exec_command(cmd, timeout=t)
    return o.read().decode("utf-8","replace").strip(), e.read().decode("utf-8","replace").strip()
M = "mysql -ucollect -p'Collect@2026' collect -N -B -e"
o,e = sh(f'{M} "SHOW TABLES LIKE \'%user%\';"'); print("用户表:", o or e)
o,e = sh(f'{M} "SELECT * FROM sys_user LIMIT 3;"'); print("用户:", (o or e)[:800])
c.close()
