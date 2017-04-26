from wxpy import *
from  datetime  import  *  
import json
import urllib
import time 

# 初始化机器人，扫码登陆
bot = Bot(cache_path=True)
bot.enable_puid('wxpy_puid.pkl')

def sendRequest(data):
    url='http://127.0.0.1:3000/message'

    jdata = json.dumps(data)             # 对数据进行JSON格式化编码
    jdata = jdata.encode(encoding='UTF8')
    req = urllib.request.Request(url, jdata)
    req.add_header('Content-Type', 'application/json')
    data = urllib.request.urlopen(req)       # 生成页面请求的完整数据
    data = data.read().decode('utf-8')
    return data             # 获取服务器返回的页面信


def get_punch_record():
    url='http://127.0.0.1:3000/punch-record'
    req = urllib.request.Request(url)
    data = urllib.request.urlopen(req)       # 生成页面请求的完整数据
    data = data.read().decode('utf-8')
    return data             # 获取服务器返回的页面信息

@bot.register()
def handle_message(msg):

    print(msg.type)
    print(msg.member.puid)
    print(msg.text)
    print(msg.is_at)

    data = {
        "type": msg.type.lower(),
        "is_at": msg.is_at,
        "text": msg.text
    }

    if(None != msg.member):
        data['member'] = {
            "puid": msg.member.puid,
            "name": msg.member.name
        }

    if('Picture' == msg.type):
        file = "./uploads/" + msg.file_name
        msg.get_file(file)
        data['file'] = file

    if('Picture' == msg.type or 'Text' == msg.type):
        print(data)
        resp = sendRequest(data)
        resp = json.loads(resp)
        print(resp)
        if('text' == resp['type']):
            msg.sender.send(resp['info'])

# 堵塞线程，并进入 Python 命令行
embed()