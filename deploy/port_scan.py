import socket

host = '101.34.91.205'
ports = [22, 2222, 2200, 80, 443, 3000, 3001, 8080, 9000]

print(f'扫描 {host} 的端口...')
for port in ports:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(3)
    try:
        result = sock.connect_ex((host, port))
        if result == 0:
            print(f'端口 {port}: 开放')
        else:
            print(f'端口 {port}: 关闭')
    except Exception as e:
        print(f'端口 {port}: 错误 - {e}')
    finally:
        sock.close()

print('\n=== 完成 ===')