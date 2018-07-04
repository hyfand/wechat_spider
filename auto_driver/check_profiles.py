from pymongo import MongoClient
from config import *

mongo_client = MongoClient(host=MONGO['host'], port=MONGO['port'])
wechat_db = mongo_client.get_database(WECHAT_DB_NAME)

posts_col = wechat_db.get_collection(POST_COL)  # 文章列表集合
profile_col = wechat_db.get_collection(PROFILE_COL)  # 公众号集合
comment_col = wechat_db.get_collection(COMMENTS_COL)  # 评论集合

# 1.清理已经迁移得公众号是null的公众号
profile_list = profile_col.find()

counter = 0
for profile in profile_list:
    if profile['title'] == None:
        counter += 1
        msgBiz = profile['msgBiz']
        profile_col.remove({'msgBiz': msgBiz})

print('[NOTICE]' + ' 检测到  %s  个已经迁移的公众号, 已经删除' % counter)

