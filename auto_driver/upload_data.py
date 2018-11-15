from pymongo import *
from config import *
import datetime, time
import requests
import json
from elasticsearch import Elasticsearch
import copy

mongo_client = MongoClient(host=MONGO['host'], port=MONGO['port'])
wechat_db = mongo_client.get_database(WECHAT_DB_NAME)

posts_col = wechat_db.get_collection(POST_COL)  # 文章列表集合
profile_col = wechat_db.get_collection(PROFILE_COL)  # 公众号集合
comment_col = wechat_db.get_collection(COMMENTS_COL)  # 评论集合

# es客户端
es = Elasticsearch(
    hosts=[{'host': ES['host'], 'port': ES['port']}],
    http_auth=(ES['auth'], ES['password'])
)

# db.getCollection('posts').find({'updateNumAt':{$gte:ISODate('2018-06-11 T00:00:00.00Z')}})
# 2018-06-12 09:56:39.989755
# 2017-04-11 T00:00:00.00Z

'''
    先判断远端数据量是否为0，如果是0则是第一次上传，那么上传全部。
    否则只上传当天
'''
count_dict = requests.get('%s/if_allupload_wechat' % REMOTE_HOST)

counts = json.loads(count_dict.content.decode('utf-8'))

print(counts)

if counts['post_count'] == 0 or counts['comment_count'] == 0 or counts['profile_count'] == 0:
    '''上传全部'''
    post_res = posts_col.find()
    comment_res = comment_col.find()
    profile_res = profile_col.find()

else:
    utc_now = datetime.datetime.now() - datetime.timedelta(days=10)
    # utc_now = datetime.datetime.now()
    post_res = posts_col.find({'publishAt': {'$gte': datetime.datetime(utc_now.year, utc_now.month, utc_now.day)}})
    comment_res = comment_col.find({'updatedAt': {'$gte': datetime.datetime(utc_now.year, utc_now.month, utc_now.day)}})
    # profile_list 基本每天都会更新 updatedAt 的日期，所以本质跟上面 profile_col.find() 一样
    profile_res = profile_col.find({'updatedAt': {'$gte': datetime.datetime(utc_now.year, utc_now.month, utc_now.day)}})


# I.先把公众号[ id 对应 title ]得map dict搞出来
id_profile_map = {}
profiles = profile_col.find()  # 防止重置冲突不能用profile_res
for item in profiles:
    id_profile_map[item['msgBiz']] = item['title']

# II.每条数据 传入Elastic服务器数据
posts_list = posts_col.find()
for i in copy.deepcopy(post_res):  # 第一次传全部posts_list，以后则更改为post_res

    if 'content' in i and i['title'] is not None:
        doc = dict(
            title=i['title'],
            topic=id_profile_map.get(i['msgBiz'], None),
            abstract=i['digest'],
            content=i['content'].replace('\xa0', ''),
            crawl_date=(i['createdAt'] + datetime.timedelta(hours=8)).strftime('%Y-%m-%d %H:%M:%S'),
            news_date=(i['publishAt'] + datetime.timedelta(hours=8)).strftime('%Y-%m-%d %H:%M:%S'),
            news_url=i['link'],
            referer_web=id_profile_map.get(i['msgBiz'], None),
            tags=id_profile_map.get(i['msgBiz'], None),
            order_date=int((time.mktime(i['publishAt'].timetuple()) + 14400 * 2) / 86400)
        )

        # print(doc)
        # try:
        #     es.index(index=ES['index'], doc_type=ES['doc_type'], body=doc)
        #     print('成功传入es')
        # except Exception as e:
        #     print('失败传入es, 原因是:', e)

        # 先查询是否存在，再插入es
        try:
            # 查询是否存在
            sql_body = {
                "query": {
                    "multi_match": {
                        "query": i['link'],
                        "type": "phrase",
                        "slop": 0,
                        "fields": [
                            "news_url"
                        ],
                    }
                }
            }

            res1 = es.search(index=ES['index'], doc_type=ES['doc_type'], body=sql_body)
            res2 = es.search(index=ES['index_total'], doc_type=ES['doc_type'], body=sql_body)


            if int(res1['hits']['total']) == 0:
                print('+++++新内容插入elastic %s: %s' % (ES['index'], i['title']))
                es.index(index=ES['index'], doc_type=ES['doc_type'], body=doc)
            else:
                print('xxxxx此内容已存在索引 %s: %s, 数量:%s' % (ES['index'], i['title'], res1['hits']['total']))

            if int(res2['hits']['total']) == 0:
                print('+++++新内容插入elastic: %s: %s' % (ES['index_total'], i['title']))
                es.index(index=ES['index_total'], doc_type=ES['doc_type'], body=doc)
            else:
                print('xxxxx此内容已存在索引 %s: %s, 数量:%s' % (ES['index_total'], i['title'], res2['hits']['total']))

        except Exception as e:
            print(e, 'elastic exception...')

# III.刷新 elasticsearch index
es.indices.refresh(index=ES['index'])
es.indices.refresh(index=ES['index_total'])

# a. 文章列表
post_list = []



for item in copy.deepcopy(post_res):

    #  没有content应该是和配置时间不符没有爬取，
    if 'content' in item and item['title'] is not None:
        item['_id'] = str(item['_id'])

        # 把时间变为本地时间
        # print(item['_id'], item['title'], item['createdAt'], item['publishAt'])
        item['createdAt'] = str(item['createdAt'] + datetime.timedelta(hours=8))
        item['publishAt'] = str(item['publishAt'] + datetime.timedelta(hours=8))
        item['updatedAt'] = str(item['updatedAt'] + datetime.timedelta(hours=8))
        try:
            item['updateNumAt'] = str(item['updateNumAt'] + datetime.timedelta(hours=8))
        except Exception as e:
            print(e)
        post_list.append(item)

    else:
        print(item['title'], ' | 没有爬到正文')
# b. 评论列表
comment_list = []
for item in comment_res:

    item['_id'] = str(item['_id'])
    item['postId'] = str(item['postId'])
    # 每个评论的回复id也要str化
    if len(item['replies']) != 0:
        for i in item['replies']:
            i['_id'] = str(i['_id'])
            i['createTime'] = str(i['createTime'] + datetime.timedelta(hours=8))

    # 把时间变为本地时间
    item['createTime'] = str(item['createTime'] + datetime.timedelta(hours=8))
    item['createdAt'] = str(item['createdAt'] + datetime.timedelta(hours=8))
    item['updatedAt'] = str(item['updatedAt'] + datetime.timedelta(hours=8))
    comment_list.append(item)
# c 公众号列表
profile_list = []
for item in profile_res:
    item['_id'] = str(item['_id'])


    # 把时间变为本地时间
    item['createdAt'] = str(item['createdAt'] + datetime.timedelta(hours=8))
    item['openHistoryPageAt'] = str(item['openHistoryPageAt'] + datetime.timedelta(hours=8))
    item['updatedAt'] = str(item['updatedAt'] + datetime.timedelta(hours=8))
    profile_list.append(item)

# 加个密码验证， 防止接口泄露， 被恶意注入数据
secret_key = '234sf3gsbx443gsgsrts34gsd43tsd'

final_dict = dict(
    secret_key=secret_key,
    post_list=post_list,
    comment_list=comment_list,
    profile_list=profile_list
)

print('公众号数量:{}\r\n文章数量:{}\r\n评论数量:{}\r\n'.format(len(profile_list), len(post_list), len(comment_list)))

json_data = json.dumps(final_dict, ensure_ascii=False)

# 向服务器api发送新爬取的数据
headers = {'Content-Type': 'application/json'}
requests.post('%s/receive_wechat' % REMOTE_HOST, headers=headers, data=json_data.encode('utf-8'))

print('已向远程主机发出数据')
