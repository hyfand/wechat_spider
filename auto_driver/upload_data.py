from time import sleep
from redis import *
from appium import webdriver
import os

desire_caps = {}
desire_caps['platformName'] = 'Android'
# 诺基亚6
# desire_caps['platformVersion'] = '8.1.0'
# desire_caps['deviceName'] = 'PL2GAM1810904175'

# 小米6
# desire_caps['platformVersion'] = '8.0.0'
# desire_caps['deviceName'] = '1231acb'

# 红米5
desire_caps['platformVersion'] = '7.1.2'
desire_caps['deviceName'] = '2466979e7cf5'

desire_caps['appPackage'] = 'com.tencent.mm'
desire_caps['appActivity'] = '.ui.LauncherUI'
# 以下两项主要是在点击输入框的时候,会触发系统输入法,导致可能我们发送的是字符 `234`,但是九宫格中文输入法有可能给出的是 `bei` ,这两个属性就是屏蔽系统输入法,使用appium自己的,但是测试完成后,得自己去系统设置中将输入法切换过来
desire_caps['unicodeKeyboard'] = True
desire_caps['resetKeyboard'] = True
# 不重置apk
desire_caps['noReset'] = True
desire_caps["newCommandTimeout"] = 172800  # 等待下一条命令延时 2 天
# desire_caps['chromeOptions'] = {'androidProcess': 'com.tencent.mm:tools'}

# ip地址在pc上的 appium客户端-设置 中可以看到 `server address` 和 `port`,保持一致即可
driver = webdriver.Remote('http://127.0.0.1:4723/wd/hub', desire_caps)

# 先进行公众号有效性检测， 已经迁移的无用公众号从mongo里删除
current_file_path = os.path.dirname(__file__)
print('[NOTICE]' + ' Clear invalid wechat profiles')
script_name = 'check_profiles.py'
script_path = os.path.join(current_file_path, script_name).replace('\\', '/')
os.system('python %s' % script_path)

sr = StrictRedis()
sr.delete('post_finish')  # 删掉redis 文章列表爬完标记
sr.delete('profile_finish') # 删掉redis 公众号走完一遍标记

sleep(10) # 等加载出通讯录。。。

# 1.点击通讯录
el_contact = driver.find_elements_by_android_uiautomator("new UiSelector().text(\"通讯录\")")[0]
el_contact.click()

# 2.点击公众号
el_public = driver.find_elements_by_android_uiautomator("new UiSelector().text(\"公众号\")")[0]
el_public.click()

# 3.第一个公众号
# driver.tap([[210, 334], [306, 399]], 20)
# el_public = driver.find_elements_by_android_uiautomator("new UiSelector().text(\"差评\")")[0]
el_public = driver.find_elements_by_id("com.tencent.mm:id/zy")[0].find_elements_by_class_name("android.widget.LinearLayout")[0].find_element_by_class_name("android.widget.LinearLayout")
el_public.click()

# 4.查看历史消息
el_info = driver.find_element_by_accessibility_id("聊天信息")
el_info.click()


sleep(3)
# driver.swipe(530, 1900, 530, 200, 200) # 滑动到底部  1080p
driver.swipe(350, 1260, 360, 480, 200) # 滑动到底部  720p 红米5

history = driver.find_elements_by_android_uiautomator("new UiSelector().text(\"全部消息\")")[0]
history.click()

sleep(10)  # 设置100秒等待，100秒后再循环问数据库是否爬完公众号列表

# ------------------------------------------
# a.循环询问redis是否爬完公众号列表 redis_key:'profile_finish'

while True:
    sleep(1)  # 1秒查询一次redis
    result = sr.get('profile_finish')
    if result == b'1':
        print('[NOTICE]' + ' Appium will click detail page')
        sr.delete('profile_finish')  # 删掉redis 公众号爬完记录 【修改到node代码一开始启动删除】
        break

# 5.点击一个详情页触发详情页
sleep(50)
# driver.tap([(530, 1300)], 200)  # 点击第一篇文章的位置进入详情 1080p
print('[NOTICE]' + 'click a detail')
driver.tap([(360, 840)], 200)  # 点击第一篇文章的位置进入详情 红米

# b.再次循环询问redis是否爬玩所有文章 redis_key:'post_finish'
while True:
    sleep(1)  # 1秒查询一次redis
    result = sr.get('post_finish')
    if result == b'1':
        print('[NOTICE]' + ' Finish crawl')
        sr.delete('post_finish')  # 删掉redis 文章列表爬完记录
        break

sleep(10)  # 给个缓冲时间
print('[NOTICE]' + ' Appium python script quit')
driver.quit()

print('[NOTICE]' + ' Upload Wechat info to Remote Server')

script_name = 'upload_data.py'
script_path = os.path.join(current_file_path, script_name).replace('\\', '/')
os.system('python %s' % script_path)
print('[NOTICE]' + ' Upload Compelete')

print('[NOTICE]' + ' 60s later close')
sleep(60)
