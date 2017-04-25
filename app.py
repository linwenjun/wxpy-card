from wxpy import *
from  datetime  import  *  
import json
import urllib
import random
import  time 

# 初始化机器人，扫码登陆
bot = Bot(cache_path=True)

def sendRequest(data):
    url='http://127.0.0.1:3000/punch-record'

    jdata = json.dumps(data)             # 对数据进行JSON格式化编码
    jdata = jdata.encode(encoding='UTF8')
    req = urllib.request.Request(url, jdata)
    req.add_header('Content-Type', 'application/json')
    data = urllib.request.urlopen(req)       # 生成页面请求的完整数据
    data = data.read()
    print(data)             # 获取服务器返回的页面信息


def get_punch_record():
    url='http://127.0.0.1:3000/punch-record'
    req = urllib.request.Request(url)
    data = urllib.request.urlopen(req)       # 生成页面请求的完整数据
    data = data.read().decode('utf-8')
    return data             # 获取服务器返回的页面信息

@bot.register()
def handle_message(msg):

    print(msg.text)
    
    # 标记名称
    # remard_friend(msg.sender)
    # 如果是群成员
    if(msg.member):
        print(msg.text)
        if(msg.type == "Text" 
            and msg.text.lower() == '芝麻开门'
            ):
            
            records = get_punch_record()
            res_msg = "今天是" + str(date.fromtimestamp(time.time())) + "\n"

            # 记录打卡人员
            
            decoded = json.loads(records)
            res_msg += "截止当前打卡人员" + str(decoded['count']) + "名:\n"
            for name in decoded['items']:
                res_msg += name + " ~ " + str(decoded['items'][name]) + "次\n"
            
            group = bot.groups()[1]

            blackList = []

            for member in group:
                if(member.name not in decoded['items']):
                    blackList.append(member.name)
                    
            res_msg += "[Facepalm]截止当前未打卡人员" + str(len(blackList)) + "名:\n"
            res_msg += ",\n".join(blackList)
            
            msg.sender.send(res_msg)

        return

    # 获取消息 print(msg.type)
    if(msg.type == "Text" or "Sharing"):
        print(json.dumps(msg.sender.raw, indent=4))
        data = {
            "name": msg.sender.name,
            "type": msg.type,
            "message": msg.text
        }
        sendRequest(data)

    if(msg.type == "Picture"):
        # print(msg.file_name)
        attachmentPath = "./uploads/" + msg.file_name
        msg.get_file(attachmentPath);

        data = {
            "name": msg.sender.name,
            "type": msg.type,
            "message": "图片打卡",
            "attachment": attachmentPath
        }

        sendRequest(data)
    else:
        print(msg.raw)
# 堵塞线程，并进入 Python 命令行
embed()