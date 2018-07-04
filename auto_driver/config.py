MONGO = {
    'host': 'localhost',
    'port': 27017
}

# 微信数据库信息
WECHAT_DB_NAME = 'wechat_spider'

# 微信集合名
POST_COL = 'posts'
PROFILE_COL = 'profiles'
COMMENTS_COL = 'comments'
CATE_COL = 'categories'

# REMOTE_HOST = 'http://192.168.1.6:5001'
REMOTE_HOST = 'http://101.200.52.207:5001'

# elastic_info
# test_server
ES = {
    'host': '192.168.1.6',
    'port': 9200,
    'auth': 'elastic',
    'password': 'PMJwu8NvD0XUfbXT40av',
    'index': 'hooyuu-test',
    'doc_type': 'news',
}

# server_2
ES = {
    'host': '101.200.52.207',
    'port': 9200,
    'auth': 'elastic',
    'password': 'HbbQH2O94w54X6LKSioz',
    'index': 'hooyuu-wemedia',
    'index_total': 'hooyuu-total',
    'doc_type': 'news',
}